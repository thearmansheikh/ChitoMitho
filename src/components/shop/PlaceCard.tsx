import Image from "next/image";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { pick } from "@/lib/names";
import type { Place } from "@/types/db";

export default async function PlaceCard({ place }: { place: Place }) {
  const locale = await getLocale();
  return (
    <Link href={`/p/${place.slug}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 shadow-sm active:bg-slate-50">
      {place.logo_url ? (
        <Image src={place.logo_url} alt="" width={56} height={56} loading="lazy" className="h-14 w-14 flex-none rounded-lg object-cover" />
      ) : (
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-lg bg-slate-100 text-2xl" aria-hidden>🍽️</div>
      )}
      <div className="min-w-0">
        <p className="truncate text-lg font-bold">{pick(place.name, place.name_ne, locale)}</p>
        {place.description && <p className="truncate text-sm text-slate-500">{place.description}</p>}
      </div>
    </Link>
  );
}
