"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatNPR } from "@/lib/format";
import { pick } from "@/lib/names";
import type { Category, Item, Place } from "@/types/db";
import DishTile from "@/components/ui/DishTile";
import AddToBasket from "./AddToBasket";

const clean = (s: string) => s.toLowerCase().trim();

/** A search box above a set of menus. While the box is empty the (server-rendered) menus show; once the
 *  customer types, matching items from every place are listed instead. */
export default function ItemSearch({ places, categories, items, children }: {
  places: Place[];
  categories: Category[];
  items: Item[];
  children: React.ReactNode;
}) {
  const t = useTranslations("menu");
  const locale = useLocale();
  const [q, setQ] = useState("");
  const placeById = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const words = clean(q).split(/\s+/).filter(Boolean);
  const searching = words.length > 0;

  const matches = useMemo(() => {
    if (!searching) return [];
    return items
      .filter((i) => {
        const place = placeById.get(i.place_id);
        if (!place) return false;
        const cat = i.category_id ? catById.get(i.category_id) : undefined;
        const hay = clean([i.name, i.name_ne, i.description, cat?.name, cat?.name_ne].filter(Boolean).join(" "));
        return words.every((w) => hay.includes(w));
      })
      .sort((a, b) => Number(b.is_available) - Number(a.is_available))
      .slice(0, 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, placeById, catById, q]);

  return (
    <div className="space-y-5">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 rounded-2xl bg-white p-2 pl-4 shadow-card ring-1 ring-slate-200">
        <span aria-hidden className="text-xl text-slate-400">🔍</span>
        <label htmlFor="item-search" className="sr-only">{t("searchLabel")}</label>
        <input
          id="item-search" value={q} onChange={(e) => setQ(e.target.value)} type="search" enterKeyHint="search"
          placeholder={t("searchPlaceholder")} autoComplete="off"
          className="min-h-[48px] min-w-0 flex-1 bg-transparent text-base placeholder:text-slate-400 focus:outline-none"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label={t("clear")} className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100">×</button>
        )}
      </form>

      {!searching && children}

      {searching && (
        <>
          <p role="status" aria-live="polite" className="text-sm font-semibold text-slate-600">
            {matches.length === 0 ? t("none") : t("results", { count: matches.length, query: q.trim() })}
          </p>
          {matches.length === 0 && <p className="text-sm text-slate-600">{t("noneHint")}</p>}
          <ul className="space-y-3">
            {matches.map((i) => {
              const place = placeById.get(i.place_id)!;
              const name = pick(i.name, i.name_ne, locale);
              const cat = i.category_id ? catById.get(i.category_id) : undefined;
              return (
                <li key={i.id} className={`flex items-center gap-3 rounded-2xl p-3 ring-1 ${i.is_available ? "bg-white shadow-card ring-slate-200/70" : "bg-slate-100 ring-slate-200"}`}>
                  <DishTile text={`${i.name} ${cat?.name ?? ""}`} type={place.type} />
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold leading-snug ${i.is_available ? "" : "text-slate-600 line-through"}`}>{name}</p>
                    {places.length > 1 && <p className="truncate text-xs text-slate-600">{pick(place.name, place.name_ne, locale)}</p>}
                    <p className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-sm font-bold ${i.is_available ? "bg-blue-50 text-brand-blue" : "bg-slate-200 text-slate-600"}`}>{formatNPR(i.price_npr)}</p>
                  </div>
                  <AddToBasket
                    available={i.is_available}
                    label={name}
                    line={{ itemId: i.id, placeId: place.id, placeName: place.name, placeNameNe: place.name_ne, placeSlug: place.slug, placeType: place.type, name: i.name, nameNe: i.name_ne, price: Number(i.price_npr) }}
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
