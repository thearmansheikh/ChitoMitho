import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { formatNPR } from "@/lib/format";
import { pick } from "@/lib/names";
import type { FeaturedItem } from "@/lib/data";
import SectionTitle from "@/components/ui/SectionTitle";
import ServiceIcon from "@/components/ui/ServiceIcon";
import AddToBasket from "./AddToBasket";

const TINT = {
  food: "from-red-100 to-amber-50",
  grocery: "from-emerald-100 to-lime-50",
  liquor: "from-amber-100 to-yellow-50",
  gifts: "from-rose-100 to-pink-50",
} as const;

/** A swipeable row of items the team picked. Renders nothing until at least one item is switched on in the admin. */
export default async function TodaysPicks({ picks }: { picks: FeaturedItem[] }) {
  if (picks.length === 0) return null;
  const t = await getTranslations("home");
  const locale = await getLocale();

  return (
    <section aria-labelledby="picks-h" className="space-y-3">
      <div>
        <SectionTitle id="picks-h">{t("picksTitle")}</SectionTitle>
        <p className="mt-1 pl-4 text-sm text-slate-500">{t("picksSub")}</p>
      </div>
      <ul className="no-scrollbar -mx-4 flex scroll-pl-4 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 pt-1">
        {picks.map(({ item, place }) => {
          const name = pick(item.name, item.name_ne, locale);
          const placeName = pick(place.name, place.name_ne, locale);
          return (
            <li key={item.id} className="w-48 shrink-0 snap-start">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-200/70">
                <div className={`relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br ${TINT[place.type]}`}>
                  {item.image_url ? (
                    <Image src={item.image_url} alt="" fill sizes="192px" loading="lazy" className="object-cover" />
                  ) : (
                    <ServiceIcon name={place.type} className="h-14 w-14" />
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-brand-red shadow-sm">
                    ★ {t("picksBadge")}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <h3 className="line-clamp-2 font-bold leading-snug">{name}</h3>
                  <Link href={`/p/${place.slug}`} className="truncate text-xs font-semibold text-brand-blue underline-offset-2 hover:underline">
                    {placeName}
                  </Link>
                  <div className="mt-auto space-y-2 pt-2">
                    <p className="text-base font-bold text-brand-blue">{formatNPR(item.price_npr)}</p>
                    <AddToBasket
                      available={item.is_available}
                      label={name}
                      line={{
                        itemId: item.id, placeId: place.id, placeName: place.name, placeNameNe: place.name_ne,
                        placeType: place.type, name: item.name, nameNe: item.name_ne, price: Number(item.price_npr),
                      }}
                    />
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
