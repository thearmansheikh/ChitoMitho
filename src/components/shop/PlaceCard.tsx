import Image from "next/image";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { pick } from "@/lib/names";
import type { Place } from "@/types/db";
import ServiceIcon from "@/components/ui/ServiceIcon";

const ICON = { food: "food", grocery: "grocery", liquor: "liquor", gifts: "gifts" } as const;

export default async function PlaceCard({ place }: { place: Place }) {
  const locale = await getLocale();
  return (
    <Link
      href={`/p/${place.slug}`}
      className="group flex items-center gap-4 rounded-2xl bg-white p-3.5 shadow-card ring-1 ring-slate-200/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99]"
    >
      {place.logo_url ? (
        <Image src={place.logo_url} alt="" width={64} height={64} loading="lazy" className="h-16 w-16 flex-none rounded-2xl object-cover ring-1 ring-slate-200" />
      ) : (
        <div aria-hidden className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-red-50 to-amber-50 ring-1 ring-slate-200">
          <ServiceIcon name={ICON[place.type]} className="h-10 w-10" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold leading-tight">{pick(place.name, place.name_ne, locale)}</p>
        {place.description && <p className="mt-0.5 truncate text-sm text-slate-500">{place.description}</p>}
      </div>
      <span aria-hidden className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-slate-100 text-brand-blue transition group-hover:bg-brand-red group-hover:text-white">→</span>
    </Link>
  );
}
