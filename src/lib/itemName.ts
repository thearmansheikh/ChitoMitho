/** The name used in baskets and WhatsApp messages: the unit or size goes after the name ("Rice 5 kg"). */
export function withUnit(name: string, unit?: string | null): string {
  const u = (unit ?? "").trim();
  return u ? `${name} ${u}` : name;
}
