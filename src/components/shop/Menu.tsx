import { getLocale, getTranslations } from "next-intl/server";
import { pick } from "@/lib/names";
import type { Category, Item, Place } from "@/types/db";
import ItemRow from "./ItemRow";
import CategoryTabs from "./CategoryTabs";

interface Props {
  place: Place;
  categories: Category[];
  items: Item[];
  showTitle?: boolean;
}

/** One place's menu: sticky category pills, then items. Sold-out items are greyed out. */
export default async function Menu({ place, categories, items, showTitle = false }: Props) {
  const locale = await getLocale();
  const t = await getTranslations("menu");
  const placeItems = items.filter((i) => i.place_id === place.id);
  const placeCats = categories.filter((c) => c.place_id === place.id);

  const groups = [
    ...placeCats.map((c) => ({ id: c.id, label: pick(c.name, c.name_ne, locale), items: placeItems.filter((i) => i.category_id === c.id) })),
    { id: "other", label: t("uncategorised"), items: placeItems.filter((i) => !i.category_id || !placeCats.some((c) => c.id === i.category_id)) },
  ].filter((g) => g.items.length > 0);

  const anchor = (id: string) => `${place.slug}-${id}`;

  return (
    <section aria-label={place.name} className="space-y-5">
      {showTitle && (
        <h2 className="flex items-center gap-2.5 text-xl font-bold text-brand-blue">
          <span aria-hidden className="h-6 w-1.5 rounded-full bg-brand-red" />
          {pick(place.name, place.name_ne, locale)}
        </h2>
      )}
      {groups.length > 1 && (
        <CategoryTabs label={t("categories")} tabs={groups.map((g) => ({ id: anchor(g.id), label: g.label }))} />
      )}
      {groups.map((g) => (
        <div key={g.id} id={anchor(g.id)} className="scroll-mt-32 space-y-3">
          {/* Keep heading levels sequential: the page title is h1, a place title (if shown) is h2. */}
          {showTitle ? <h3 className="text-lg font-bold">{g.label}</h3> : <h2 className="text-lg font-bold">{g.label}</h2>}
          <ul className="space-y-3">
            {g.items.map((i) => (
              <ItemRow
                key={i.id}
                item={{ name: i.name, name_ne: i.name_ne, description: i.description, image_url: i.image_url, is_available: i.is_available, options: i.options }}
                placeType={place.type}
                tileText={`${i.name} ${i.name_ne ?? ""} ${g.label}`}
                line={{
                  itemId: i.id, placeId: place.id, placeName: place.name, placeNameNe: place.name_ne, placeSlug: place.slug,
                  placeType: place.type, name: i.name, nameNe: i.name_ne, price: Number(i.price_npr),
                }}
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
