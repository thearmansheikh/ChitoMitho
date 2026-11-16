import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/data";
import BasketCount from "./BasketCount";

export default async function BottomBar() {
  const t = await getTranslations("bar");
  const s = await getSettings();
  const btn = "flex min-h-[52px] flex-1 items-center justify-center rounded-xl text-base font-bold";
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto flex max-w-3xl gap-2">
        <Link href="/basket" aria-label={t("basket")} className={`${btn} bg-brand-blue text-white`}>
          🧺 {t("basket")}
          <BasketCount />
        </Link>
        <a href={`https://wa.me/977${s.whatsapp_number}`} aria-label={t("whatsapp")} className={`${btn} bg-green-600 text-white`}>💬 {t("whatsapp")}</a>
      </div>
    </nav>
  );
}
