import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/data";
import AgeGate from "@/components/shop/AgeGate";
import TypeMenus from "@/components/shop/TypeMenus";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Liquor delivery in Dharan (18+)",
  description: "Beer, wine and spirits delivered in Dharan for adults 18 and over. ID checked at the door. Order on WhatsApp.",
};

export default async function LiquorPage() {
  const t = await getTranslations("pages");
  const s = await getTranslations("serviceDesc");
  const settings = await getSettings();
  return (
    <AgeGate text={settings.liquor_age_text}>
      <div className="space-y-6">
        <PageHeader icon="🍺" tone="amber" title={t("liquorTitle")} subtitle={s("liquor")} />
        <TypeMenus type="liquor" />
      </div>
    </AgeGate>
  );
}
