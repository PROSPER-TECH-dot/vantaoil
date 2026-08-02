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

async function get(path: string): Promise<ZengaResult> {
  const response = await fetch(`${baseUrl()}${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey()}`, Accept: 'application/json' },
  });
  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* provider returned plain text */
  }
  if (!response.ok) console.error(`ZENGAPAY GET ${path} failed [${response.status}]: ${text}`);
  return { ok: response.ok, status: response.status, body: parsed };
}

export function getCollection(reference: string) {
  return get(`/collections/${encodeURIComponent(reference)}`);
}

export function getTransfer(reference: string) {
  return get(`/transfers/${encodeURIComponent(reference)}`);
}

type Loose = Record<string, unknown>;

function dig(body: unknown): Loose {
  let node = body as Loose | undefined;
  for (const key of ['result', 'data']) {
    if (node && typeof node === 'object' && key in node) node = node[key] as Loose;
  }
  return (node ?? {}) as Loose;
}

/** Provider transaction reference from a collection/transfer response, if present. */
export function providerReference(body: unknown): string | null {
  const node = dig(body);
  for (const key of ['transactionReference', 'transactionSystemId', 'transaction_reference', 'reference', 'id']) {
    const value = node[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return null;
}

/** Normalised transaction status: 'success' | 'failed' | 'pending'. */
export function transactionOutcome(body: unknown): 'success' | 'failed' | 'pending' {
  const node = dig(body);
  const raw = String(node['transactionStatus'] ?? node['status'] ?? '').toUpperCase();
  if (['SUCCEEDED', 'SUCCESS', 'COMPLETED', 'SUCCESSFUL'].includes(raw)) return 'success';
  if (['FAILED', 'REJECTED', 'CANCELLED', 'CANCELED', 'EXPIRED', 'DECLINED'].includes(raw)) return 'failed';
  return 'pending';
}

export function providerMessage(body: unknown, fallback: string) {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}
