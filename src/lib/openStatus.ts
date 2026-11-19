import { isOpenNow, nowMinutesNPT, parseTimeToMinutes } from "./format";

/** Opening and closing time for one day, "HH:MM" (seconds are ignored). */
export interface ShopHours {
  open: string;
  close: string;
}

export type OpenStatus =
  | { open: true; closesAt: string }
  | {
      open: false;
      /** The next time the shop opens, "HH:MM". */
      opensAt: string;
      /** False: it opens later today. True: it opens tomorrow (it has already closed for today). */
      opensTomorrow: boolean;
    };

const hhmm = (t: string) => t.slice(0, 5);

/**
 * Whether the shop is open at this moment, judged in Nepal time (Asia/Kathmandu, UTC+5:45) no matter where the visitor's phone is.
 * Open from the opening minute up to, but not including, the closing minute: 10:00 is open, 21:59 is open, 22:00 is closed.
 * `tomorrow` is tomorrow's hours when they differ from today's (different hours on different weekdays).
 */
export function openStatus(today: ShopHours, tomorrow?: ShopHours | null, now: Date = new Date()): OpenStatus {
  if (isOpenNow(today.open, today.close, now)) return { open: true, closesAt: hhmm(today.close) };
  const before = nowMinutesNPT(now) < parseTimeToMinutes(today.open);
  if (before) return { open: false, opensAt: hhmm(today.open), opensTomorrow: false };
  return { open: false, opensAt: hhmm((tomorrow ?? today).open), opensTomorrow: true };
}

/**
 * What can still be ordered for later. Today is possible only while there is time left before closing (with a lead time for the kitchen and rider).
 */
export function todayStillPossible(today: ShopHours, leadMinutes: number, now: Date = new Date()): boolean {
  return nowMinutesNPT(now) + leadMinutes < parseTimeToMinutes(today.close);
}
