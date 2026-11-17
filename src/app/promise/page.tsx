import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Our promise – how Chitto Mitho delivery works in Dharan",
  description:
    "Clear delivery charges confirmed on WhatsApp, cash or QR at the door, your details kept private, and what to do if something goes wrong.",
  alternates: { canonical: "/promise" },
};

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
      <div>
        <h1 className="text-2xl font-extrabold text-brand-blue">{t("title")}</h1>
        <p className="mt-1 text-slate-600">{t("intro")}</p>
      </div>

      <ul className="space-y-3">
        {SECTIONS.map(([key, icon]) => (
          <li key={key} className="flex gap-3 rounded-xl border border-slate-200 p-4">
            <span className="text-2xl" aria-hidden>{icon}</span>
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
          <a href={`https://wa.me/977${s.whatsapp_number}`} className="flex min-h-[52px] items-center justify-center rounded-xl bg-green-700 font-bold text-white">
            💬 {c("whatsapp")}
          </a>
          <a href={`tel:+977${s.phone_numbers[0] ?? s.whatsapp_number}`} className="flex min-h-[52px] items-center justify-center rounded-xl bg-brand-blue font-bold text-white">
            📞 {c("call")}
          </a>
        </div>
        <Link href="/partner" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-blue underline">{t("partnerLink")}</Link>
      </section>
    </div>
  );
}
