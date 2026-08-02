import { createServerFn } from '@tanstack/react-start';

import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/** Starts a mobile money deposit: creates the pending recharge, then pushes the payment prompt. */
export const startDeposit = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { amount: number; msisdn?: string }) => {
    const amount = Math.floor(Number(input?.amount));
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid recharge amount');
    return { amount, msisdn: typeof input.msisdn === 'string' ? input.msisdn : '' };
  })
  .handler(async ({ data, context }) => {
    const { toMsisdn, createCollection, providerMessage } = await import('./zengapay.server');

    const { data: profile } = await context.supabase
      .from('profiles')
      .select('phone')
      .eq('id', context.userId)
      .maybeSingle();

    const msisdn = toMsisdn(data.msisdn || profile?.phone);
    if (msisdn.length < 12) throw new Error('Add a valid mobile money number to your account first');

    const { data: recharge, error } = await context.supabase.rpc('create_recharge', {
      p_amount: data.amount,
      p_msisdn: msisdn,
    });
    if (error) throw new Error(error.message);
    const order = recharge as unknown as { order_no: string };

    const result = await createCollection({
      msisdn,
      amount: data.amount,
      externalReference: order.order_no,
      narration: `Vanta Oil recharge ${order.order_no}`,
    });

    if (!result.ok) {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
      await supabaseAdmin.rpc('fail_recharge_by_reference', { p_reference: order.order_no });
      throw new Error(providerMessage(result.body, 'Could not reach mobile money. Please try again.'));
    }

    return { orderNo: order.order_no };
  });

/** Requests a withdrawal. The payout is only sent after an administrator approves it. */
export const startWithdrawal = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { amount: number; msisdn?: string }) => {
    const amount = Math.floor(Number(input?.amount));
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid withdrawal amount');
    return { amount, msisdn: typeof input.msisdn === 'string' ? input.msisdn : '' };
  })
  .handler(async ({ data, context }) => {
    const { toMsisdn } = await import('./zengapay.server');

    const { data: profile } = await context.supabase
      .from('profiles')
      .select('phone')
      .eq('id', context.userId)
      .maybeSingle();

    const msisdn = toMsisdn(data.msisdn || profile?.phone);

    const { data: withdrawal, error } = await context.supabase.rpc('request_withdrawal', {
      p_amount: data.amount,
      p_msisdn: msisdn,
    });
    if (error) throw new Error(error.message);
    const row = withdrawal as unknown as { order_no: string };

    return { orderNo: row.order_no };
  });

/** Admin approves a withdrawal: sends the mobile money payout, then marks it successful. */
export const approveWithdrawal = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error('Missing withdrawal');
    return { id: String(input.id) };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    });
    if (!isAdmin) throw new Error('Forbidden');

    const { createTransfer, toMsisdn, providerMessage } = await import('./zengapay.server');

    const { data: row, error } = await context.supabase
      .from('withdrawals')
      .select('id, order_no, amount, received, status, msisdn, user_id')
      .eq('id', data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error('Withdrawal not found');
    if (row.status === 'Success') return { ok: true, alreadyPaid: true };

    const { data: profile } = await context.supabase
      .from('profiles')
      .select('phone')
      .eq('id', row.user_id)
      .maybeSingle();

    const msisdn = toMsisdn(row.msisdn || profile?.phone);
    if (msisdn.length < 12) throw new Error('This member has no valid mobile money number');

    const result = await createTransfer({
      msisdn,
      amount: row.received,
      externalReference: row.order_no,
      narration: `Vanta Oil payout ${row.order_no}`,
    });

    if (!result.ok) {
      throw new Error(providerMessage(result.body, 'Mobile money payout failed. Please try again.'));
    }

    const { error: statusError } = await context.supabase.rpc('admin_set_withdrawal_status', {
      p_id: row.id,
      p_status: 'Success',
    });
    if (statusError) throw new Error(statusError.message);

    return { ok: true, alreadyPaid: false };
  });

/** Admin declines a withdrawal: the full amount, including the fee, is refunded to the member. */
export const rejectWithdrawal = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error('Missing withdrawal');
    return { id: String(input.id) };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    });
    if (!isAdmin) throw new Error('Forbidden');

    const { error } = await context.supabase.rpc('admin_set_withdrawal_status', {
      p_id: data.id,
      p_status: 'Rejected',
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
