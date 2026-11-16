import { getTranslations } from "next-intl/server";
import { getPlaces } from "@/lib/data";
import PlaceCard from "@/components/shop/PlaceCard";

export default async function FoodPage() {
  const t = await getTranslations("pages");
  const places = await getPlaces("food");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-blue">{t("foodTitle")}</h1>
        <p className="text-slate-600">{t("foodIntro")}</p>
      </div>
      {places.length === 0 ? (
        <p className="text-slate-500">{t("noPlaces")}</p>
      ) : (
        <div className="space-y-2">{places.map((p) => <PlaceCard key={p.id} place={p} />)}</div>
      )}
    </div>
  );
}
