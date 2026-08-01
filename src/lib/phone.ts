/** Vanta Oil accounts are keyed by phone number; auth needs an email, so we derive one. */
export function phoneToEmail(rawPhone: string) {
  const digits = rawPhone.replace(/\D/g, "").replace(/^0+/, "");
  return `u256${digits}@vantaoil.app`;
}
