import WhatsAppLink from "@/components/WhatsAppLink";
import { callNumbers } from "@/lib/contact";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/data";
import PageHeader from "@/components/ui/PageHeader";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Our delivery promise in Dharan",
  path: "/promise",
  description: "Clear delivery charges confirmed on WhatsApp, cash or QR at the door, your details kept private, and what to do if something goes wrong."
});

const SECTIONS = [
  ["s1", "💬"],
  ["s2", "💵"],
  ["s3", "🔒"],
  ["s4", "✏️"],
  ["s5", "🛟"],
  ["s6", "🔞"],
  ["s7", "🕙"],
] as const;

export default async function PromisePage() {
  const t = await getTranslations("promise");
  const c = await getTranslations("common");
  const s = await getSettings();
  return (
    <div className="space-y-6">
      <PageHeader icon="🤝" tone="blue" title={t("title")} subtitle={t("intro")} />

      <ul className="space-y-3">
        {SECTIONS.map(([key, icon]) => (
          <li key={key} className="flex gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200/70">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-blue-50 text-2xl" aria-hidden>{icon}</span>
            <div>
              <h2 className="font-bold">{t(`${key}Title`)}</h2>
              <p className="mt-1 text-slate-700">{t(`${key}Body`)}</p>
            </div>
          </li>
        ))}
      </ul>

      <section className="space-y-3 rounded-xl bg-slate-50 p-4">
        <h2 className="font-bold">{t("questions")}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <WhatsAppLink number={s.whatsapp_number} className="flex min-h-[52px] items-center justify-center rounded-xl bg-green-700 font-bold text-white">
            💬 {c("whatsappLabel", { number: s.whatsapp_number })}
          </WhatsAppLink>
          <a href={`tel:+977${callNumbers(s)[0]}`} className="flex min-h-[52px] items-center justify-center rounded-xl bg-brand-blue font-bold text-white">
            📞 {c("callLabel", { number: callNumbers(s)[0] })}
          </a>
        </div>
        <Link href="/partner" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-blue underline">{t("partnerLink")}</Link>
      </section>
    </div>
  );
}
