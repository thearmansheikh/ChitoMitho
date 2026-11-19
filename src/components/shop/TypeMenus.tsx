import { getTranslations } from "next-intl/server";
import { getMenu, getPlaces, getSettings } from "@/lib/data";
import { noMenuModeOf, visiblePlaces } from "@/lib/places";
import ComingSoon from "./ComingSoon";
import type { PlaceType } from "@/types/db";
import Menu from "./Menu";
import ItemSearch from "./ItemSearch";

/** Menus of every active place of one type (groceries, liquor, gifts). */
export default async function TypeMenus({ type, searchable = false }: { type: PlaceType; searchable?: boolean }) {
  const t = await getTranslations("pages");
  const settings = await getSettings();
  const places = visiblePlaces(await getPlaces(type), noMenuModeOf(settings));
  const { categories, items } = await getMenu(places.map((p) => p.id));
  const hasItems = (id: string) => items.some((i) => i.place_id === id);
  if (places.length === 0) return <p className="text-slate-500">{t("noPlaces")}</p>;
  const menus = (
    <div className="space-y-8">
      {places.map((p) =>
        hasItems(p.id)
          ? <Menu key={p.id} place={p} categories={categories} items={items} showTitle={places.length > 1} />
          : <ComingSoon key={p.id} place={p} number={settings.whatsapp_number} linkToPlace />,
      )}
    </div>
  );
  if (!searchable) return menus;
  return <ItemSearch places={places.filter((p) => hasItems(p.id))} categories={categories} items={items}>{menus}</ItemSearch>;
}
