import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPlaces } from "@/lib/data";
import PlaceCard from "@/components/shop/PlaceCard";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Food delivery in Dharan",
  description: "Order from the best cafés and restaurants in Dharan. Momo, burgers, coffee and more, delivered to your door. Order on WhatsApp.",
};

export default async function FoodPage() {
  const t = await getTranslations("pages");
  const places = await getPlaces("food");
  return (
    <div className="space-y-6">
      <PageHeader icon="🍔" tone="red" title={t("foodTitle")} subtitle={t("foodIntro")} />
      {places.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-card">{t("noPlaces")}</p>
      ) : (
        <div className="space-y-3">{places.map((p) => <PlaceCard key={p.id} place={p} />)}</div>
      )}
    </div>
  );
}
