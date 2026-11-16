import { getTranslations } from "next-intl/server";
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
