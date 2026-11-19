import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { pick } from "@/lib/names";
import { hasMenu } from "@/lib/places";
import type { Place } from "@/types/db";

/** The cafés and shops we deliver from. Each logo opens that place's page. */
export default async function PartnerStrip({ title, places }: { title: string; places: Place[] }) {
  const t = await getTranslations("pages");
  const locale = await getLocale();
  const withLogo = places.filter((p) => p.logo_url);
  if (withLogo.length === 0) return null;
  return (
    <section className="space-y-3" aria-label={title}>
      <p className="text-center text-sm font-semibold text-slate-600">{title}</p>
      <ul className="flex flex-wrap justify-center gap-3">
        {withLogo.map((p) => {
          const name = pick(p.name, p.name_ne, locale);
          return (
            <li key={p.id}>
              <Link
                href={`/p/${p.slug}`}
                aria-label={hasMenu(p) ? name : `${name} – ${t("comingSoon")}`}
                className="block h-[72px] w-[72px] overflow-hidden rounded-full bg-white shadow-card ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
              >
                <Image src={p.logo_url as string} alt={name} width={144} height={144} loading="lazy" className="h-full w-full object-cover" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
