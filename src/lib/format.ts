/** Nepal Standard Time is UTC+5:45 (no DST). */
export const NPT_OFFSET_MINUTES = 5 * 60 + 45;

export function formatNPR(n: number): string {
  return `Rs. ${Math.round(n).toLocaleString("en-US")}`;
}

/** Current wall-clock time in Nepal as minutes since midnight. */
export function nowMinutesNPT(now: Date = new Date()): number {
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  return (utcMin + NPT_OFFSET_MINUTES) % (24 * 60);
}

/** Today's and tomorrow's date in Nepal as "YYYY-MM-DD" (for scheduled orders). */
export function nepalDates(now: Date = new Date()): { today: string; tomorrow: string } {
  const shifted = now.getTime() + NPT_OFFSET_MINUTES * 60_000;
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return { today: iso(shifted), tomorrow: iso(shifted + 86_400_000) };
}

/** Parse "10:00" or "22:00:00" to minutes since midnight. */
export function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** True if Nepal time is within [open, close). Handles overnight ranges. */
export function isOpenNow(open: string, close: string, now: Date = new Date()): boolean {
  const cur = nowMinutesNPT(now);
  const o = parseTimeToMinutes(open);
  const c = parseTimeToMinutes(close);
  return o <= c ? cur >= o && cur < c : cur >= o || cur < c;
}
