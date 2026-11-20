import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/data";
import { pageMeta } from "@/lib/seo";
import { liquorEnabledOf } from "@/lib/liquor";
import AgeGate from "@/components/shop/AgeGate";
import TypeMenus from "@/components/shop/TypeMenus";
import PageHeader from "@/components/ui/PageHeader";
import ServiceIcon from "@/components/ui/ServiceIcon";

export async function generateMetadata(): Promise<Metadata> {
  const on = liquorEnabledOf(await getSettings());
  // While liquor is switched off this page says "coming soon", so search engines are asked to skip it.
  return pageMeta({
    title: on ? "Liquor delivery in Dharan (18+)" : "Liquor delivery: coming soon",
    description: "Beer, wine and spirits delivered in Dharan for adults 18 and over. ID checked at the door. Order on WhatsApp.",
    path: "/liquor",
    noindex: !on,
  });
}

export default async function LiquorPage() {
  const t = await getTranslations("pages");
  const l = await getTranslations("liquor");
  const s = await getTranslations("serviceDesc");
  const settings = await getSettings();
  const on = liquorEnabledOf(settings);

  return (
    <div className="space-y-6">
      {/* The heading and the 18+ line are real page content, so they are there before any script runs. */}
      <PageHeader icon={<ServiceIcon name="liquor" className="h-9 w-9" />} tone="amber" title={t("liquorTitle")} subtitle={on ? s("liquor") : undefined} />
      {on ? (
        <>
          <p className="rounded-xl bg-amber-50 p-3 text-center font-bold text-amber-900 ring-1 ring-amber-200">{l("ageNote")}</p>
          <AgeGate text={settings.liquor_age_text}>
            <TypeMenus type="liquor" />
          </AgeGate>
        </>
      ) : (
        <section className="space-y-2 rounded-2xl bg-white p-5 text-center shadow-card ring-1 ring-slate-200/70">
          <p className="text-lg font-bold">{t("liquorSoonTitle")}</p>
          <p className="text-slate-700">{t("liquorSoonBody")}</p>
        </section>
      )}
    </div>
  );
}
