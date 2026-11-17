import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/data";
import LangToggle from "./LangToggle";
import OpenBadge from "./OpenBadge";

export default async function Header() {
  const t = await getTranslations("brand");
  const s = await getSettings();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white shadow-[0_6px_20px_-14px_rgba(26,43,76,.45)]">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
        <Link href="/" className="flex items-center gap-2.5" aria-label={t("name")}>
          <Image src="/icons/logo.png" alt="" width={44} height={44} priority className="rounded-full shadow-card" />
          <span className="hidden leading-tight min-[380px]:block">
            <span className="block text-lg font-bold text-brand-blue">{t("name")}</span>
            <span className="block text-[11px] font-semibold text-brand-red">{t("tagline")}</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <OpenBadge openTime={s.open_time} closeTime={s.close_time} paused={s.orders_paused} />
          <LangToggle />
        </div>
      </div>
    </header>
  );
}
