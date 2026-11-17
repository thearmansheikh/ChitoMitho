import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Privacy – what this website stores",
  description: "In plain words: Chitto Mitho’s website does not store your name, phone number or location. Orders go through your own WhatsApp message.",
  alternates: { canonical: "/privacy" },
};

const COUNT = 8;

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  return (
    <div className="space-y-6">
      <PageHeader icon="🔒" tone="ink" title={t("title")} subtitle={t("intro")} />
      <div className="space-y-3">
        {Array.from({ length: COUNT }, (_, i) => i + 1).map((n) => (
          <section key={n} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/70">
            <h2 className="font-bold">{t(`s${n}Title`)}</h2>
            <p className="mt-1 text-slate-700">{t(`s${n}Body`)}</p>
          </section>
        ))}
      </div>
      <p className="text-sm text-slate-500">{t("updated")}</p>
    </div>
  );
}
