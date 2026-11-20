import Image from "next/image";
import Link from "next/link";
import DishIcon, { DISH_TINT, dishFor, type DishName } from "@/components/ui/DishIcon";
import type { Place, PlaceType } from "@/types/db";
import PlaceOpenChip from "./PlaceOpenChip";
import PlaceLogo from "./PlaceLogo";
import { hasMenu } from "@/lib/places";

const BY_TYPE: Record<PlaceType, DishName> = { food: "burger", grocery: "grocery", liquor: "beer", gifts: "bouquet" };

/**
 * A café or shop: a coloured cover showing what it sells, its name, a line about it and tag chips.
 * Takes plain, already-translated text so it works on the server and in the search page.
 */
export default function PlaceCard({ place, name, tags = [], comingSoon }: { place: Place; name: string; tags?: string[]; /** The badge text, shown only when the place has no menu yet. */ comingSoon?: string }) {
  // Up to three different dishes, taken from the place's menu categories.
  const dishes = [...new Set(tags.map((t) => dishFor(t)).filter((d): d is DishName => d !== null))].slice(0, 3);
  if (dishes.length === 0) dishes.push(BY_TYPE[place.type]);

  return (
    <Link
      href={`/p/${place.slug}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99]"
    >
      <div className={`relative flex h-28 items-center justify-center gap-3 overflow-hidden bg-gradient-to-br ${DISH_TINT[dishes[0]]}`}>
        {place.cover_url && <Image src={place.cover_url} alt="" aria-hidden fill sizes="(max-width: 640px) 100vw, 400px" loading="lazy" className="object-cover" />}
        {!place.cover_url && <span aria-hidden className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/40" />}
        {!place.cover_url && <span aria-hidden className="absolute -bottom-10 left-6 h-20 w-20 rounded-full bg-white/30" />}
        {!place.cover_url && dishes.map((d, i) => (
          <DishIcon key={d} name={d} className={`relative drop-shadow-sm transition-transform duration-200 group-hover:scale-110 ${i === 0 ? "h-20 w-20" : "h-14 w-14"}`} />
        ))}
        <PlaceOpenChip opensAt={place.opens_at} closesAt={place.closes_at} />
        {comingSoon && !hasMenu(place) && (
          <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">{comingSoon}</span>
        )}
        <PlaceLogo logoUrl={place.logo_url} name={name} className="absolute bottom-2 left-2" />
      </div>
      <div className="space-y-1.5 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-lg font-bold leading-tight">{name}</p>
          <span aria-hidden className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-slate-100 text-brand-blue transition group-hover:bg-brand-red group-hover:text-white">→</span>
        </div>
        {place.description && <p className="truncate text-sm text-slate-500">{place.description}</p>}
        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {tags.slice(0, 4).map((t) => (
              <li key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{t}</li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
