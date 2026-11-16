import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Liquor delivery in Dharan (18+)",
  description: "Beer, wine and spirits delivered in Dharan for adults 18 and over. ID checked at the door. Order on WhatsApp.",
};
import { getSettings } from "@/lib/data";
import AgeGate from "@/components/shop/AgeGate";
import TypeMenus from "@/components/shop/TypeMenus";

export default async function LiquorPage() {
  const t = await getTranslations("pages");
  const s = await getSettings();
  return (
    <AgeGate text={s.liquor_age_text}>
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-brand-blue">{t("liquorTitle")}</h1>
        <TypeMenus type="liquor" />
      </div>
    </AgeGate>
  );
}
