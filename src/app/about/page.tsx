import WhatsAppLink from "@/components/WhatsAppLink";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/data";
import { SITE } from "@/lib/config";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "About & contact – delivery in Dharan",
  description: "Chitto Mitho is an everyday delivery service in Dharan, Nepal. Opening hours, phone, WhatsApp, TikTok and Instagram.",
};

export default async function AboutPage() {
  const t = await getTranslations("about");
  const c = await getTranslations("common");
  const f = await getTranslations("footer");
  const s = await getSettings();
  const btn = "flex min-h-[52px] items-center justify-center rounded-xl px-4 font-bold";
  return (
    <div className="space-y-6">
      <PageHeader icon="ℹ️" tone="blue" title={t("title")} />
      <p className="text-slate-700">{t("story")}</p>
      <p className="text-slate-700">{t("areas")}</p>

      <section className="space-y-1">
        <h2 className="text-lg font-bold">{t("hoursTitle")}</h2>
        <p className="text-slate-700">{t("hours")}</p>
      </section>

      <section className="space-y-1">
        <h2 className="text-lg font-bold">{t("payTitle")}</h2>
        <p className="text-slate-700">{t("pay")}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">{t("contactTitle")}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {s.phone_numbers.map((p) => (
            <a key={p} href={`tel:+977${p}`} className={`${btn} bg-brand-blue text-white`}>📞 {c("call")} {p}</a>
          ))}
          <WhatsAppLink number={s.whatsapp_number} className={`${btn} bg-green-700 text-white`}>💬 {c("whatsapp")}</WhatsAppLink>
          <a href={`https://www.tiktok.com/@${SITE.tiktok}`} target="_blank" rel="noopener noreferrer" className={`${btn} border border-slate-300`}>{f("tiktok")} @{SITE.tiktok}</a>
          <a href={`https://www.instagram.com/${SITE.instagram}`} target="_blank" rel="noopener noreferrer" className={`${btn} border border-slate-300`}>{f("instagram")} @{SITE.instagram}</a>
        </div>
      </section>
    </div>
  );
}
