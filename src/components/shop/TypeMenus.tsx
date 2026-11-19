import { getTranslations } from "next-intl/server";
import { getMenu, getPlaces, getSettings } from "@/lib/data";
import { noMenuModeOf, visiblePlaces } from "@/lib/places";
import ComingSoon from "./ComingSoon";
import WhatsAppLink from "@/components/WhatsAppLink";
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
  // Nothing to show yet in this section: say so kindly and offer WhatsApp instead of an empty page.
  const named = places.filter((p) => !hasItems(p.id) && p.logo_url);
  const anyItems = places.some((p) => hasItems(p.id));
  if (!anyItems && named.length === 0) {
    return (
      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/70">
        <p className="text-slate-700">{t("sectionEmpty")}</p>
        <WhatsAppLink number={settings.whatsapp_number} className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-green-700 px-4 text-center font-bold text-white">
          <span aria-hidden>💬</span> {t("sectionEmptyButton")}
        </WhatsAppLink>
      </section>
    );
  }
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
