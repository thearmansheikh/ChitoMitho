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
        <nav aria-label={t("categories")} className="no-scrollbar sticky top-[61px] z-20 -mx-4 flex gap-2 overflow-x-auto bg-paper/95 px-4 py-3 backdrop-blur">
          {groups.map((g) => (
            <a key={g.id} href={`#${anchor(g.id)}`} className="whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-blue shadow-card ring-1 ring-slate-200 transition active:scale-95 active:bg-brand-blue active:text-white">
              {g.label}
            </a>
          ))}
        </nav>
      )}
      {groups.map((g) => (
        <div key={g.id} id={anchor(g.id)} className="scroll-mt-32 space-y-3">
          {/* Keep heading levels sequential: the page title is h1, a place title (if shown) is h2. */}
          {showTitle ? <h3 className="text-lg font-bold">{g.label}</h3> : <h2 className="text-lg font-bold">{g.label}</h2>}
          <ul className="space-y-3">
            {g.items.map((i) => {
              const name = pick(i.name, i.name_ne, locale);
              return (
                <li key={i.id} className={`flex items-center gap-3 rounded-2xl p-3.5 ring-1 ${i.is_available ? "bg-white shadow-card ring-slate-200/70" : "bg-slate-100 ring-slate-200"}`}>
                  {i.image_url && (
                    <Image src={i.image_url} alt="" width={72} height={72} loading="lazy" className={`h-[72px] w-[72px] flex-none rounded-xl object-cover ${i.is_available ? "" : "opacity-50 grayscale"}`} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold leading-snug ${i.is_available ? "" : "text-slate-600 line-through"}`}>{name}</p>
                    {i.description && <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{i.description}</p>}
                    <p className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-sm font-bold ${i.is_available ? "bg-blue-50 text-brand-blue" : "bg-slate-200 text-slate-600"}`}>
                      {formatNPR(i.price_npr)}
                    </p>
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
