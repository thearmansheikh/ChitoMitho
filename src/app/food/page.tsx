import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getMenu, getPlaces, getSettings } from "@/lib/data";
import { noMenuModeOf, visiblePlaces } from "@/lib/places";
import FoodBrowser from "@/components/shop/FoodBrowser";
import PageHeader from "@/components/ui/PageHeader";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Food delivery in Dharan",
  path: "/food",
  description: "Order from cafés and restaurants in Dharan. Momo, burgers, coffee and more, delivered to your door. Order on WhatsApp."
});

export default async function FoodPage({ searchParams }: { searchParams: { q?: string | string[] } }) {
  const t = await getTranslations("pages");
  const settings = await getSettings();
  const places = visiblePlaces(await getPlaces("food"), noMenuModeOf(settings));
  const { categories, items } = await getMenu(places.map((p) => p.id));
  const raw = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  const initialQuery = (raw ?? "").slice(0, 60);

  return (
    <div className="space-y-6">
      <PageHeader icon={<ServiceIcon name="food" className="h-9 w-9" />} tone="red" title={t("foodTitle")} subtitle={t("foodIntro")} />
      {places.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-card">{t("noPlaces")}</p>
      ) : (
        <FoodBrowser places={places} categories={categories} items={items} initialQuery={initialQuery} whatsapp={settings.whatsapp_number} />
      )}
    </div>
  );
}
