import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/data";
import BasketCount from "./BasketCount";

/** Floating pill on phones: the basket and WhatsApp are always one tap away. */
export default async function BottomBar() {
  const t = await getTranslations("bar");
  const s = await getSettings();
  const btn = "flex min-h-[52px] flex-1 items-center justify-center gap-1 rounded-xl text-base font-bold transition active:scale-[0.97]";
  return (
    <nav
      aria-label={t("basket")}
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 rounded-2xl bg-white/95 p-2 shadow-float ring-1 ring-slate-200 md:hidden"
    >
      <div className="mx-auto flex max-w-3xl gap-2">
        <Link href="/basket" aria-label={t("basket")} className={`${btn} bg-brand-blue text-white`}>
          <span aria-hidden>🧺</span> {t("basket")}
          <BasketCount />
        </Link>
        <a href={`https://wa.me/977${s.whatsapp_number}`} aria-label={t("whatsapp")} className={`${btn} bg-green-700 text-white`}>
          <span aria-hidden>💬</span> {t("whatsapp")}
        </a>
      </div>
    </nav>
  );
}
