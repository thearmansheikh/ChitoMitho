"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CRAVINGS } from "@/lib/cravings";
import { formatNPR, isOpenNow } from "@/lib/format";
import { pick } from "@/lib/names";
import { placeTags } from "@/lib/tags";
import type { Category, Item, Place } from "@/types/db";
import DishIcon, { DISH_TINT } from "@/components/ui/DishIcon";
import DishTile from "@/components/ui/DishTile";
import ScooterArt from "@/components/ui/ScooterArt";
import AddToBasket from "./AddToBasket";
import { withUnit } from "@/lib/itemName";
import PlaceCard from "./PlaceCard";

const clean = (s: string) => s.toLowerCase().trim();

/** Search and browse: type a word or tap a craving, see matching dishes and cafés from everywhere at once. */
export default function FoodBrowser({ places, categories, items, initialQuery }: {
  places: Place[];
  categories: Category[];
  items: Item[];
  initialQuery: string;
}) {
  const t = useTranslations("food");
  const pg = useTranslations("pages");
  const c = useTranslations("craving");
  const locale = useLocale();
  const [q, setQ] = useState(initialQuery);

  // Keep the search in the address bar so a search can be shared or bookmarked, without adding history entries.
  useEffect(() => {
    const url = new URL(window.location.href);
    const text = q.trim();
    if (text) url.searchParams.set("q", text);
    else url.searchParams.delete("q");
    if (url.toString() !== window.location.href) window.history.replaceState(window.history.state, "", url.toString());
  }, [q]);

  const placeById = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);
  const catById = useMemo(() => new Map(categories.map((x) => [x.id, x])), [categories]);

  const words = useMemo(() => clean(q).split(/\s+/).filter(Boolean), [q]);
  const searching = words.length > 0;

  const matchedItems = useMemo(() => {
    if (!searching) return [];
    return items
      .filter((i) => {
        const place = placeById.get(i.place_id);
        if (!place) return false;
        const cat = i.category_id ? catById.get(i.category_id) : undefined;
        const hay = clean([i.name, i.name_ne, i.description, cat?.name, cat?.name_ne, place.name, place.name_ne].filter(Boolean).join(" "));
        return words.every((w) => hay.includes(w));
      })
      .sort((a, b) => Number(b.is_available) - Number(a.is_available))
      .slice(0, 30);
  }, [items, placeById, catById, searching, words]);

  // Places with their own hours that are closed right now go to the end (the browser knows the time only after load).
  const [clock, setClock] = useState(0);
  useEffect(() => { setClock(Date.now()); }, []);
  const ordered = useMemo(() => {
    if (!clock) return places;
    const closed = (p: Place) => !!p.opens_at && !!p.closes_at && !isOpenNow(p.opens_at.slice(0, 5), p.closes_at.slice(0, 5), new Date(clock));
    return [...places].sort((a, b) => Number(closed(a)) - Number(closed(b)));
  }, [places, clock]);

  const matchedPlaces = useMemo(() => {
    if (!searching) return ordered;
    return ordered.filter((p) => {
      const hay = clean([p.name, p.name_ne, p.description, ...categories.filter((x) => x.place_id === p.id).flatMap((x) => [x.name, x.name_ne ?? ""])].filter(Boolean).join(" "));
      return words.every((w) => hay.includes(w));
    });
  }, [ordered, categories, searching, words]);

  const nothing = searching && matchedItems.length === 0 && matchedPlaces.length === 0;

  return (
    <div className="space-y-6">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 rounded-2xl bg-white p-2 pl-4 shadow-card ring-1 ring-slate-200">
        <span aria-hidden className="text-xl text-slate-400">🔍</span>
        <label htmlFor="food-search" className="sr-only">{t("searchLabel")}</label>
        <input
          id="food-search" value={q} onChange={(e) => setQ(e.target.value)} type="search" enterKeyHint="search"
          placeholder={t("searchPlaceholder")} autoComplete="off"
          className="min-h-[48px] min-w-0 flex-1 bg-transparent text-base placeholder:text-slate-400 focus:outline-none"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label={t("clear")} className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100">
            ×
          </button>
        )}
      </form>

      <div role="group" aria-label={c("title")} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {CRAVINGS.map((x) => {
          const on = clean(q) === x.q;
          return (
            <button
              key={x.key} type="button" aria-pressed={on} onClick={() => setQ(on ? "" : x.q)}
              className={`flex min-h-[44px] flex-none items-center gap-2 rounded-full py-1 pl-1.5 pr-4 text-sm font-semibold shadow-card ring-1 transition active:scale-95 ${on ? "bg-brand-blue text-white ring-brand-blue" : "bg-white ring-slate-200"}`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${DISH_TINT[x.dish]}`}>
                <DishIcon name={x.dish} className="h-6 w-6" />
              </span>
              {c(`items.${x.key}`)}
            </button>
          );
        })}
      </div>

      {searching && (
        <p role="status" aria-live="polite" className="text-sm font-semibold text-slate-600">
          {t("results", { count: matchedItems.length + matchedPlaces.length, query: q.trim() })}
        </p>
      )}

      {nothing && (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-8 text-center shadow-card ring-1 ring-slate-200/70">
          <ScooterArt className="h-24 w-auto" />
          <p className="text-lg font-bold">{t("noResults")}</p>
          <p className="max-w-xs text-sm text-slate-600">{t("noResultsHint")}</p>
          <button type="button" onClick={() => setQ("")} className="mt-2 min-h-[48px] rounded-xl bg-brand-blue px-5 font-bold text-white">{t("clear")}</button>
        </div>
      )}

      {matchedItems.length > 0 && (
        <section aria-labelledby="dishes-h" className="space-y-3">
          <h2 id="dishes-h" className="flex items-center gap-2.5 text-lg font-bold">
            <span aria-hidden className="h-5 w-1.5 rounded-full bg-brand-red" />
            {t("dishes")}
          </h2>
          <ul className="space-y-3">
            {matchedItems.map((i) => {
              const place = placeById.get(i.place_id)!;
              const name = pick(i.name, i.name_ne, locale);
              const cat = i.category_id ? catById.get(i.category_id) : undefined;
              return (
                <li key={i.id} className={`flex items-center gap-3 rounded-2xl p-3 ring-1 ${i.is_available ? "bg-white shadow-card ring-slate-200/70" : "bg-slate-100 ring-slate-200"}`}>
                  <DishTile text={`${i.name} ${cat?.name ?? ""}`} type={place.type} />
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold leading-snug ${i.is_available ? "" : "text-slate-600 line-through"}`}>{name}</p>{" "}
                    {i.unit && <><p className="text-sm font-semibold text-slate-600">{i.unit}</p>{" "}</>}
                    <Link href={`/p/${place.slug}`} className="block truncate text-xs font-semibold text-brand-blue underline-offset-2 hover:underline">
                      {pick(place.name, place.name_ne, locale)}
                    </Link>{" "}
                    <p className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-sm font-bold ${i.is_available ? "bg-blue-50 text-brand-blue" : "bg-slate-200 text-slate-600"}`}>
                      {formatNPR(i.price_npr)}
                    </p>
                  </div>{" "}
                  <AddToBasket
                    item={{ name: i.name, name_ne: i.name_ne, description: i.description, image_url: i.image_url, is_available: i.is_available, options: i.options, unit: i.unit }}
                    available={i.is_available}
                    label={name}
                    line={{
                      itemId: i.id, placeId: place.id, placeName: place.name, placeNameNe: place.name_ne, placeSlug: place.slug,
                      placeType: place.type, name: withUnit(i.name, i.unit), nameNe: i.name_ne ? withUnit(i.name_ne, i.unit) : null, price: Number(i.price_npr),
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {matchedPlaces.length > 0 && (
        <section aria-labelledby="places-h" className="space-y-3">
          <h2 id="places-h" className="flex items-center gap-2.5 text-lg font-bold">
            <span aria-hidden className="h-5 w-1.5 rounded-full bg-brand-red" />
            {t("places")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {matchedPlaces.map((p) => (
              <PlaceCard key={p.id} place={p} name={pick(p.name, p.name_ne, locale)} tags={placeTags(p.id, categories, locale)} comingSoon={pg("comingSoon")} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
