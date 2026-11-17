import type { Offer } from "@/types/db";

export interface PromoState {
  offer: Offer | null;
  /** Code is known, in date, and the basket reaches its minimum. */
  ok: boolean;
  /** How much more the customer must add to reach the minimum (0 when ok or unknown). */
  short: number;
}

export function normalizeCode(s: string): string {
  return s.replace(/\s+/g, "").toUpperCase();
}

/** Check a typed code against the live offers. Offers the visitor can see are already in date (database rule). */
export function checkPromo(offers: Offer[], code: string, total: number): PromoState {
  const c = normalizeCode(code);
  const offer = c ? offers.find((o) => o.code && normalizeCode(o.code) === c) ?? null : null;
  if (!offer) return { offer: null, ok: false, short: 0 };
  const min = offer.min_order_npr ?? 0;
  const short = Math.max(0, min - total);
  return { offer, ok: short === 0, short };
}
