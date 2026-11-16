import type { OrderConfig } from "@/components/forms/SendOrder";
import type { Settings } from "@/types/db";

export function toOrderConfig(s: Settings): OrderConfig {
  return {
    openTime: s.open_time,
    closeTime: s.close_time,
    paused: s.orders_paused,
    pauseMessage: s.pause_message,
    whatsapp: s.whatsapp_number,
  };
}
