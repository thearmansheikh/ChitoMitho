import { getTranslations } from "next-intl/server";
import { getMenu, getPlaces } from "@/lib/data";
import type { PlaceType } from "@/types/db";
import Menu from "./Menu";
import ItemSearch from "./ItemSearch";

/** Menus of every active place of one type (groceries, liquor, gifts). */
export default async function TypeMenus({ type, searchable = false }: { type: PlaceType; searchable?: boolean }) {
  const t = await getTranslations("pages");
  const places = await getPlaces(type);
  const { categories, items } = await getMenu(places.map((p) => p.id));
  if (places.length === 0) return <p className="text-slate-500">{t("noPlaces")}</p>;
  const menus = (
    <div className="space-y-8">
      {places.map((p) => (
        <Menu key={p.id} place={p} categories={categories} items={items} showTitle={places.length > 1} />
      ))}
    </div>
  );
  if (!searchable) return menus;
  return <ItemSearch places={places} categories={categories} items={items}>{menus}</ItemSearch>;
}
