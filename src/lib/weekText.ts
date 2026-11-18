import "server-only";
import { getTranslations } from "next-intl/server";
import { dayRangeLabel, groupWeek, type WeekHours } from "./hours";

/** The week's hours as short lines, in the visitor's language: [{ label: "Mon–Fri", text: "10:00 – 22:00" }, …]. */
export async function weekLines(week: WeekHours): Promise<{ label: string; text: string }[]> {
  const t = await getTranslations("weekHours");
  return groupWeek(week).map((g) => ({
    label: dayRangeLabel(g.days, (d) => t(`d${d}`)),
    text: g.closed ? t("closed") : `${g.open} – ${g.close}`,
  }));
}

/** The same lines joined into one sentence-friendly string. */
export async function weekSummary(week: WeekHours): Promise<string> {
  return (await weekLines(week)).map((l) => `${l.label} ${l.text}`).join(" · ");
}
