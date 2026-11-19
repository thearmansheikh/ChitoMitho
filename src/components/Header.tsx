import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/data";
import { liquorEnabledOf } from "@/lib/liquor";
import BasketCount from "./BasketCount";
import LangToggle from "./LangToggle";
import NavLinks from "./NavLinks";
import OpenBadge from "./OpenBadge";
import WhatsAppLink from "./WhatsAppLink";

export default async function Header() {
  const t = await getTranslations("brand");
  const n = await getTranslations("nav");
  const bar = await getTranslations("bar");
  const s = await getSettings();

  const items = [
    { href: "/food", label: n("food") },
    { href: "/groceries", label: n("grocery") },
    ...(liquorEnabledOf(s) ? [{ href: "/liquor", label: n("liquor") }] : []),
    { href: "/gifts", label: n("gifts") },
    { href: "/parcel", label: n("parcel") },
    { href: "/anything", label: n("anything") },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white shadow-[0_6px_20px_-14px_rgba(26,43,76,.45)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="flex flex-none items-center gap-2.5" aria-label={t("name")}>
          <Image src="/icons/logo.png" alt={t("logoAlt")} width={44} height={44} priority className="rounded-full shadow-card" />
          {/* The logo already carries the name, so small phones show the logo alone and keep room for the badge and language toggle. */}
          <span className="hidden leading-tight min-[480px]:block">
            <span className="block text-lg font-bold text-brand-blue">{t("name")}</span>
            <span className="block text-[11px] font-semibold text-brand-red lg:max-xl:hidden">{t("tagline")}</span>
          </span>
        </Link>

        <NavLinks items={items} label={n("main")} />

        <div className="flex items-center gap-2">
          <OpenBadge openTime={s.open_time} closeTime={s.close_time} paused={s.orders_paused} />
          <LangToggle />
          {/* On phones these two live in the floating bottom bar; from tablet width up they live here. */}
          <Link
            href="/basket"
            aria-label={bar("basket")}
            className="hidden min-h-[44px] items-center gap-1 rounded-xl bg-brand-blue px-4 font-bold text-white shadow-pop transition hover:bg-[#244a82] active:scale-95 md:inline-flex"
          >
            <span aria-hidden>🧺</span> {bar("basket")}
            <BasketCount />
          </Link>
          <WhatsAppLink
            basketAware
            number={s.whatsapp_number}
            ariaLabel={bar("whatsapp")}
            className="hidden h-11 w-11 items-center justify-center rounded-full bg-green-700 text-lg text-white transition hover:bg-green-800 active:scale-95 xl:inline-flex"
          >
            <span aria-hidden>💬</span>
          </WhatsAppLink>
        </div>
      </div>
    </header>
  );
}
