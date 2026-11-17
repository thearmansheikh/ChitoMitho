import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CRAVINGS } from "@/lib/cravings";
import DishIcon, { DISH_TINT } from "@/components/ui/DishIcon";
import SectionTitle from "@/components/ui/SectionTitle";

/** Round dish shortcuts: tap "Momo" and land on a list of momo from every café. */
export default async function CravingRow() {
  const t = await getTranslations("craving");
  return (
    <section aria-labelledby="craving-h" className="space-y-3">
      <SectionTitle id="craving-h">{t("title")}</SectionTitle>
      <ul className="no-scrollbar -mx-4 flex scroll-pl-4 snap-x gap-4 overflow-x-auto px-4 pb-2 pt-1">
        {CRAVINGS.map((c) => (
          <li key={c.key} className="snap-start">
            <Link href={`/food?q=${encodeURIComponent(c.q)}`} className="group flex w-[76px] flex-col items-center gap-2 text-center">
              <span className={`flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br shadow-card ring-1 ring-slate-200/70 transition duration-200 group-hover:-translate-y-0.5 group-active:scale-95 ${DISH_TINT[c.dish]}`}>
                <DishIcon name={c.dish} className="h-11 w-11" />
              </span>
              <span className="text-xs font-semibold leading-tight">{t(`items.${c.key}`)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
