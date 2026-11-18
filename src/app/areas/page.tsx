import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getAreas, getSettings } from "@/lib/data";
import { pick } from "@/lib/names";
import { validWeekHours } from "@/lib/hours";
import { weekSummary } from "@/lib/weekText";
import PageHeader from "@/components/ui/PageHeader";
import SectionTitle from "@/components/ui/SectionTitle";
import type { AreaGroup } from "@/types/db";

export const metadata: Metadata = {
  title: "Where we deliver – Dharan, Itahari, Biratnagar",
  description: "Chitto Mitho delivers in Dharan and nearby areas in every direction, including Itahari and Biratnagar. See the places we cover and how delivery charges work.",
  alternates: { canonical: "/areas" },
};

const GROUPS: AreaGroup[] = ["dharan", "itahari", "biratnagar", "nearby"];
const MAP_QUERY: Partial<Record<AreaGroup, string>> = {
  dharan: "Dharan, Nepal",
  itahari: "Itahari, Nepal",
  biratnagar: "Biratnagar, Nepal",
};

export default async function AreasPage() {
  const t = await getTranslations("areasPage");
  const locale = await getLocale();
  const [areas, settings] = await Promise.all([getAreas(), getSettings()]);
  const hours = { open: settings.open_time.slice(0, 5), close: settings.close_time.slice(0, 5) };
  const week = validWeekHours(settings.weekday_hours);
  const schedule = week ? await weekSummary(week) : "";

  return (
    <div className="space-y-8">
      <PageHeader icon="🗺️" tone="green" title={t("title")} subtitle={t("intro")} />

      <section aria-labelledby="listed-h" className="space-y-4">
        <SectionTitle id="listed-h">{t("listed")}</SectionTitle>
        {areas.length === 0 && <p className="rounded-2xl bg-white p-5 text-slate-600 shadow-card">{t("empty")}</p>}
        {GROUPS.map((g) => {
          const list = areas.filter((a) => a.area_group === g);
          if (list.length === 0) return null;
          const q = MAP_QUERY[g];
          return (
            <div key={g} className="space-y-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200/70">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold">{t(`groups.${g}`)}</h3>
                {q && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-brand-blue underline-offset-2 hover:underline"
                  >
                    <span aria-hidden>🗺️</span> {t("viewMap", { place: t(`groups.${g}`) })}
                  </a>
                )}
              </div>
              <ul className="flex flex-wrap gap-2">
                {list.map((a) => (
                  <li key={a.id} className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-100">
                    {pick(a.name, a.name_ne, locale)}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-100">
          <h2 className="font-bold">{t("notListedTitle")}</h2>
          <p className="mt-1 text-slate-700">{t("notListedBody")}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/70">
          <h2 className="font-bold">{t("chargeTitle")}</h2>
          <p className="mt-1 text-slate-700">{t("chargeBody")}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/70">
          <h2 className="font-bold">{t("hoursTitle")}</h2>
          <p className="mt-1 text-slate-700">{week ? t("hoursBodyWeek", { schedule }) : t("hoursBody", hours)}</p>
        </div>
      </section>

      <Link href="/" className="flex min-h-[56px] items-center justify-center rounded-2xl bg-brand-red font-bold text-white shadow-lg shadow-brand-red/30 transition active:scale-95">
        {t("cta")}
      </Link>
    </div>
  );
}
