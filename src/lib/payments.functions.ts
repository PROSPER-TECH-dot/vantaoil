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

/** Requests a withdrawal and immediately attempts the mobile money payout. */
export const startWithdrawal = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { amount: number; msisdn?: string }) => {
    const amount = Math.floor(Number(input?.amount));
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid withdrawal amount');
    return { amount, msisdn: typeof input.msisdn === 'string' ? input.msisdn : '' };
  })
  .handler(async ({ data, context }) => {
    const { toMsisdn, createTransfer } = await import('./zengapay.server');

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
    const row = withdrawal as unknown as { order_no: string; received: number };

    // Payout is attempted right away; if the provider rejects it the request simply
    // stays "Processing" for an administrator to review.
    const result = await createTransfer({
      msisdn,
      amount: row.received,
      externalReference: row.order_no,
      narration: `Vanta Oil payout ${row.order_no}`,
    });

    return { orderNo: row.order_no, dispatched: result.ok };
  });
