import type { Settings } from "@/types/db";

/**
 * The numbers to show as "Call: …". The WhatsApp number is shown on its own "WhatsApp: …" line, so it is left out here
 * unless it is the only number there is.
 */
export function callNumbers(s: Pick<Settings, "phone_numbers" | "whatsapp_number">): string[] {
  const calls = s.phone_numbers.filter((p) => p !== s.whatsapp_number);
  return calls.length > 0 ? calls : s.phone_numbers.slice(0, 1);
}
