/** Server-only ZENGAPAY (Uganda mobile money) helpers. Never import from client code. */

export type ZengaResult = { ok: boolean; status: number; body: unknown };

function baseUrl() {
  return (process.env['ZENGAPAY_BASE_URL'] ?? 'https://api.zengapay.com/v1').replace(/\/$/, '');
}

function apiKey() {
  const key = process.env['ZENGAPAY_API_KEY'];
  if (!key) throw new Error('Mobile money is not configured yet');
  return key;
}

/** Normalises any Ugandan phone input to the 2567XXXXXXXX form ZENGAPAY expects. */
export function toMsisdn(input: string | null | undefined) {
  const digits = (input ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('256')) return digits;
  if (digits.startsWith('0')) return `256${digits.slice(1)}`;
  if (digits.length === 9) return `256${digits}`;
  return digits;
}

async function call(path: string, body: Record<string, unknown>): Promise<ZengaResult> {
  const response = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* provider returned plain text */
  }
  if (!response.ok) {
    console.error(`ZENGAPAY ${path} failed [${response.status}]: ${text}`);
  }
  return { ok: response.ok, status: response.status, body: parsed };
}

/** Requests money FROM a customer (deposit). The customer approves a prompt on their phone. */
export function createCollection(input: {
  msisdn: string;
  amount: number;
  externalReference: string;
  narration: string;
}) {
  return call('/collections', {
    msisdn: input.msisdn,
    amount: input.amount,
    external_reference: input.externalReference,
    narration: input.narration,
  });
}

/** Sends money TO a customer (withdrawal payout). */
export function createTransfer(input: {
  msisdn: string;
  amount: number;
  externalReference: string;
  narration: string;
}) {
  return call('/transfers', {
    msisdn: input.msisdn,
    amount: input.amount,
    external_reference: input.externalReference,
    narration: input.narration,
    use_contact: false,
  });
}

export function providerMessage(body: unknown, fallback: string) {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}
