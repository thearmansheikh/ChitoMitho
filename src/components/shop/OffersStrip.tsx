import { getLocale, getTranslations } from "next-intl/server";
import { formatNPR } from "@/lib/format";
import { pick } from "@/lib/names";
import type { Offer } from "@/types/db";
import CopyCode from "./CopyCode";

/** Current offers as coupon tickets in a swipeable row. Renders nothing when there are none. */
export default async function OffersStrip({ offers }: { offers: Offer[] }) {
  if (offers.length === 0) return null;
  const t = await getTranslations("offers");
  const locale = await getLocale();
  const day = new Intl.DateTimeFormat(locale === "ne" ? "ne-NP" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <section aria-labelledby="offers-h" className="space-y-3">
      <h2 id="offers-h" className="text-xl font-extrabold">{t("title")}</h2>
      <ul className="no-scrollbar -mx-4 flex scroll-pl-4 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {offers.map((o) => {
          const body = pick(o.body ?? "", o.body_ne, locale);
          return (
            <li key={o.id} className="w-[84%] max-w-sm shrink-0 snap-start sm:w-80">
              <article className="flex h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div
                  aria-hidden
                  className="flex w-9 flex-none items-center justify-center rotate-180 bg-brand-red text-[11px] font-bold tracking-[0.3em] text-white [writing-mode:vertical-rl]"
                >
                  {t("stub")}
                </div>
                <div className="min-w-0 flex-1 space-y-2 border-l-2 border-dashed border-brand-red/30 p-4">
                  <h3 className="font-bold leading-snug">{pick(o.title, o.title_ne, locale)}</h3>
                  {body && <p className="text-sm text-slate-600">{body}</p>}
                  {o.code && <CopyCode code={o.code} />}
                  <p className="space-x-3 text-xs text-slate-500">
                    {o.min_order_npr ? <span>{t("minOrder", { amount: formatNPR(o.min_order_npr) })}</span> : null}
                    {o.ends_on ? <span>{t("until", { date: day.format(new Date(`${o.ends_on}T00:00:00Z`)) })}</span> : null}
                  </p>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
