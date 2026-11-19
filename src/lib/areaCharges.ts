import type { Area } from "@/types/db";
import { formatNPR } from "./format";
import { pick } from "./names";

/** An area's fixed delivery charge as a number, or null when it depends on distance and order. */
export function fixedChargeOf(a: Pick<Area, "delivery_charge_npr">): number | null {
  const n = a.delivery_charge_npr == null ? NaN : Number(a.delivery_charge_npr);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** "BPKIHS Rs. 50, Bhanu Chowk Rs. 60": every area that has a fixed charge, in the visitor's language. */
export function fixedChargeList(areas: Area[], locale: string): string {
  return areas
    .filter((a) => a.is_active !== false && fixedChargeOf(a) !== null)
    .map((a) => `${pick(a.name, a.name_ne, locale)} ${formatNPR(fixedChargeOf(a) as number)}`)
    .join(", ");
}
