import { createFileRoute } from '@tanstack/react-router';
import { createHmac, timingSafeEqual } from 'crypto';

type WebhookData = {
  transactionSystemId?: string;
  transactionStatus?: string;
  transactionExternalReference?: string;
  amount?: string | number;
  msisdn?: string;
};

function signatureValid(raw: string, header: string | null) {
  const secret = process.env['ZENGAPAY_WEBHOOK_SECRET'];
  // No secret hash configured yet — accept and rely on reference matching.
  if (!secret) return true;
  if (!header) return false;
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const Route = createFileRoute('/api/public/zengapay-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();

        if (!signatureValid(raw, request.headers.get('x-zengapay-signature'))) {
          return new Response('Invalid signature', { status: 401 });
        }

        let payload: { event?: string; data?: WebhookData };
        try {
          payload = JSON.parse(raw) as { event?: string; data?: WebhookData };
        } catch {
          return new Response('Invalid payload', { status: 400 });
        }

        const event = String(payload.event ?? '');
        const data = payload.data ?? {};
        const reference = data.transactionExternalReference;
        if (!reference) return new Response('Missing reference', { status: 202 });

        const providerRef = data.transactionSystemId ?? null;
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

        if (event === 'collection.success') {
          await supabaseAdmin.rpc('credit_recharge_by_reference', {
            p_reference: reference,
            p_provider_ref: providerRef,
          });
        } else if (event === 'collection.failed') {
          await supabaseAdmin.rpc('fail_recharge_by_reference', {
            p_reference: reference,
            p_provider_ref: providerRef,
          });
        } else if (event === 'transfer.success') {
          await supabaseAdmin.rpc('settle_withdrawal_by_reference', {
            p_reference: reference,
            p_status: 'Success',
            p_provider_ref: providerRef,
          });
        } else if (event === 'transfer.failed') {
          await supabaseAdmin.rpc('settle_withdrawal_by_reference', {
            p_reference: reference,
            p_status: 'Rejected',
            p_provider_ref: providerRef,
          });
        }

        return new Response('ok', { status: 202 });
      },
    },
  },
});
