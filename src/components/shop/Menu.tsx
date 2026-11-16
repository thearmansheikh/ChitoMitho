import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { formatNPR } from "@/lib/format";
import { pick } from "@/lib/names";
import type { Category, Item, Place } from "@/types/db";
import AddToBasket from "./AddToBasket";

interface Props {
  place: Place;
  categories: Category[];
  items: Item[];
  showTitle?: boolean;
}

/** One place's menu: sticky category tabs, then items. Sold-out items are greyed out. */
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
    <section aria-label={place.name} className="space-y-4">
      {showTitle && (
        <h2 className="text-xl font-extrabold text-brand-blue">{pick(place.name, place.name_ne, locale)}</h2>
      )}
      {groups.length > 1 && (
        <nav aria-label={t("categories")} className="sticky top-[57px] z-20 -mx-4 flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2">
          {groups.map((g) => (
            <a key={g.id} href={`#${anchor(g.id)}`} className="whitespace-nowrap rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-brand-blue">
              {g.label}
            </a>
          ))}
        </nav>
      )}
      {groups.map((g) => (
        <div key={g.id} id={anchor(g.id)} className="scroll-mt-28 space-y-2">
          {/* Keep heading levels sequential: the page title is h1, a place title (if shown) is h2. */}
          {showTitle ? <h3 className="text-lg font-bold">{g.label}</h3> : <h2 className="text-lg font-bold">{g.label}</h2>}
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {g.items.map((i) => {
              const name = pick(i.name, i.name_ne, locale);
              return (
                <li key={i.id} className={`flex items-center gap-3 p-3 ${i.is_available ? "" : "bg-slate-50"}`}>
                  {i.image_url && (
                    <Image src={i.image_url} alt="" width={64} height={64} loading="lazy" className={`h-16 w-16 flex-none rounded-lg object-cover ${i.is_available ? "" : "opacity-50 grayscale"}`} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold leading-snug ${i.is_available ? "" : "text-slate-600 line-through"}`}>{name}</p>
                    {i.description && <p className="text-sm text-slate-600">{i.description}</p>}
                    <p className={`font-bold ${i.is_available ? "text-brand-blue" : "text-slate-600"}`}>{formatNPR(i.price_npr)}</p>
                  </div>
                  <AddToBasket
                    available={i.is_available}
                    label={name}
                    line={{
                      itemId: i.id, placeId: place.id, placeName: place.name, placeNameNe: place.name_ne,
                      placeType: place.type, name: i.name, nameNe: i.name_ne, price: Number(i.price_npr),
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
