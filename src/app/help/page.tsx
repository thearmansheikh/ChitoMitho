import WhatsAppLink from "@/components/WhatsAppLink";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getAreas, getSettings } from "@/lib/data";
import PageHeader from "@/components/ui/PageHeader";
import { validWeekHours } from "@/lib/hours";
import { deliveryFromOf } from "@/lib/orderConfig";
import { fixedChargeList } from "@/lib/areaCharges";
import { formatNPR } from "@/lib/format";
import { weekSummary } from "@/lib/weekText";

export const metadata: Metadata = {
  title: "Help and questions – how ordering works",
  description: "Answers about ordering on WhatsApp, delivery charges, payment, opening hours, areas, changes, problems and liquor orders with Chitto Mitho in Dharan.",
  alternates: { canonical: "/help" },
};

const COUNT = 14;

export default async function HelpPage() {
  const t = await getTranslations("help");
  const locale = await getLocale();
  const c = await getTranslations("common");
  const s = await getSettings();
  const hours = { open: s.open_time.slice(0, 5), close: s.close_time.slice(0, 5) };
  const week = validWeekHours(s.weekday_hours);
  const schedule = week ? await weekSummary(week) : "";
  // Question 4 is about opening hours: with different hours on different days it lists the whole week.
  const from = deliveryFromOf(s);
  const fixedList = fixedChargeList(await getAreas(), locale);
  const chargeAnswer = (from != null ? t("a3From", { amount: formatNPR(from) }) : t("a3", hours)) + (fixedList ? " " + t("fixedCharges", { list: fixedList }) : "");
  const answer = (n: number) => (n === 4 && week ? t("a4Week", { schedule }) : n === 3 ? chargeAnswer : t(`a${n}`, hours));
  const items = Array.from({ length: COUNT }, (_, i) => ({ q: t(`q${i + 1}`), a: answer(i + 1) }));

  // Lets search engines show the answers directly.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
  };

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        // "<" is escaped so no text can close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <PageHeader icon="❓" tone="blue" title={t("title")} subtitle={t("intro")} />

      <div className="space-y-3">
        {items.map((x, i) => (
          <details key={i} className="group rounded-2xl bg-white shadow-card ring-1 ring-slate-200/70 open:ring-brand-blue/40">
            <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-bold [&::-webkit-details-marker]:hidden">
              <span>{x.q}</span>
              <span aria-hidden className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-slate-100 text-lg text-brand-blue transition group-open:rotate-45 group-open:bg-brand-blue group-open:text-white">+</span>
            </summary>
            <p className="px-4 pb-4 text-slate-700">{x.a}</p>
          </details>
        ))}
      </div>

      <section className="space-y-3 rounded-2xl bg-slate-100 p-5">
        <h2 className="font-bold">{t("stuckTitle")}</h2>
        <p className="text-slate-700">{t("stuckBody")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <WhatsAppLink number={s.whatsapp_number} className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-green-700 font-bold text-white">
            <span aria-hidden>💬</span> {c("whatsapp")}
          </WhatsAppLink>
          <a href={`tel:+977${s.phone_numbers[0] ?? s.whatsapp_number}`} className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-brand-blue font-bold text-white">
            <span aria-hidden>📞</span> {c("call")}
          </a>
        </div>
      </section>
    </div>
  );
}
