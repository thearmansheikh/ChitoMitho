import { NPT_OFFSET_MINUTES } from "./format";

/** Opening hours for one day. When `closed` is true the shop takes no orders that day. */
export interface DayHours {
  open: string;
  close: string;
  closed?: boolean;
}

/** Seven entries, index 0 = Sunday … 6 = Saturday (the same numbering as JavaScript's getDay). */
export type WeekHours = DayHours[];

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const DAY_NAMES_NE = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"] as const;

const TIME = /^([01]\d|2[0-3]):[0-5]\d/;

/** Day of the week in Nepal right now (0 = Sunday). */
export function nepalWeekday(now: Date = new Date()): number {
  return new Date(now.getTime() + NPT_OFFSET_MINUTES * 60_000).getUTCDay();
}

/** Returns the stored value only if it is a well-formed week; anything else means "same hours every day". */
export function validWeekHours(v: unknown): WeekHours | null {
  if (!Array.isArray(v) || v.length !== 7) return null;
  const week: WeekHours = [];
  for (const d of v) {
    if (!d || typeof d !== "object") return null;
    const { open, close, closed } = d as Record<string, unknown>;
    if (typeof open !== "string" || typeof close !== "string" || !TIME.test(open) || !TIME.test(close)) return null;
    week.push({ open: open.slice(0, 5), close: close.slice(0, 5), closed: closed === true });
  }
  return week;
}

/** The hours that apply on the given Nepal weekday. */
export function hoursFor(week: WeekHours, weekday: number): DayHours {
  return week[((weekday % 7) + 7) % 7];
}
