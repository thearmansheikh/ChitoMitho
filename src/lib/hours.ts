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

/** The hours of the next day the shop is open after the given weekday (skips closed days). Falls back to that day's own hours. */
export function nextOpenHours(week: WeekHours, weekday: number): DayHours {
  for (let i = 1; i <= 7; i++) {
    const h = hoursFor(week, weekday + i);
    if (!h.closed) return h;
  }
  return hoursFor(week, weekday);
}

/** Days in the order people read a week (Monday first). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export interface HoursGroup {
  /** Weekday numbers (0 = Sunday), in reading order. */
  days: number[];
  open: string;
  close: string;
  closed: boolean;
}

/** Runs of neighbouring days with identical hours, Monday first. */
export function groupWeek(week: WeekHours): HoursGroup[] {
  const groups: HoursGroup[] = [];
  for (const day of WEEK_ORDER) {
    const d = week[day];
    const last = groups.at(-1);
    const same = last && last.closed === !!d.closed && (d.closed || (last.open === d.open && last.close === d.close));
    if (same) last.days.push(day);
    else groups.push({ days: [day], open: d.open, close: d.close, closed: !!d.closed });
  }
  return groups;
}

/** "Mon–Fri" for three or more days in a row, "Sat, Sun" for two, "Mon" for one. */
export function dayRangeLabel(days: number[], name: (day: number) => string): string {
  if (days.length >= 3) return `${name(days[0])}–${name(days[days.length - 1])}`;
  return days.map(name).join(", ");
}
