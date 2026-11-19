import type { OrderConfig } from "@/components/forms/SendOrder";
import type { Settings } from "@/types/db";

/** The "delivery starts from" amount as a number, or null when none is set. */
export function deliveryFromOf(s: Pick<Settings, "delivery_from_npr">): number | null {
  const n = s.delivery_from_npr == null ? NaN : Number(s.delivery_from_npr);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function toOrderConfig(s: Settings): OrderConfig {
  return {
    openTime: s.open_time,
    closeTime: s.close_time,
    tomorrowOpen: s.tomorrow_open_time ?? null,
    tomorrowClose: s.tomorrow_close_time ?? null,
    paused: s.orders_paused,
    pauseMessage: s.pause_message,
    pauseMessageNe: s.pause_message_ne ?? null,
    whatsapp: s.whatsapp_number,
    deliveryFrom: deliveryFromOf(s),
  };
}
