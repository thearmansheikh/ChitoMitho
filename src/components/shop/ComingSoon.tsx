import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { pick } from "@/lib/names";
import type { Place } from "@/types/db";
import WhatsAppLink from "@/components/WhatsAppLink";

/** A place with no menu yet: says so plainly and offers to arrange the order on WhatsApp. */
export default async function ComingSoon({ place, number, linkToPlace = false }: { place: Place; number: string; linkToPlace?: boolean }) {
  const t = await getTranslations("pages");
  const locale = await getLocale();
  const name = pick(place.name, place.name_ne, locale);
  return (
    <section aria-label={name} className="space-y-3 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/70">
      <h2 className="text-lg font-bold">
        {linkToPlace ? <Link href={`/p/${place.slug}`} className="text-brand-blue hover:underline">{name}</Link> : name}{" "}
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">{t("comingSoon")}</span>
      </h2>
      <p className="text-slate-700">{t("comingSoonBody")}</p>
      <WhatsAppLink number={number} placeName={name} className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-green-700 px-4 text-center font-bold text-white">
        <span aria-hidden>💬</span> {t("orderFrom", { name })}
      </WhatsAppLink>
    </section>
  );
}
