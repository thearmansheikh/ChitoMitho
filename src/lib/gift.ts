import type { GiftDetails } from "@/context/BasketContext";
import { PHONE_RE, normalizePhone } from "./details";
import { nepalDates, nowMinutesNPT, parseTimeToMinutes } from "./format";

export type GiftIssue = "name" | "phone" | "dateNeeded" | "datePast" | "timeOutside" | "timeSoon";

/** A gift can be asked for as soon as possible (no date or time), or for a day and time we can really keep. */
const LEAD_MINUTES = 30;

/**
 * Everything wrong with the gift details, most important first. An empty list means they are fine.
 * Dates are compared in Nepal time, so a customer abroad or a phone on the wrong clock cannot pick a past day.
 */
export function giftIssues(g: GiftDetails, open: string, close: string, now: Date = new Date()): GiftIssue[] {
  const out: GiftIssue[] = [];
  if (!g.recipientName.trim()) out.push("name");
  if (!PHONE_RE.test(normalizePhone(g.recipientPhone))) out.push("phone");

  const { today } = nepalDates(now);
  if (g.date && g.date < today) out.push("datePast");
  if (g.time) {
    if (!g.date) {
      out.push("dateNeeded");
    } else {
      const m = parseTimeToMinutes(g.time);
      if (m < parseTimeToMinutes(open) || m >= parseTimeToMinutes(close)) out.push("timeOutside");
      else if (g.date === today && m < nowMinutesNPT(now) + LEAD_MINUTES) out.push("timeSoon");
    }
  }
  return out;
}
