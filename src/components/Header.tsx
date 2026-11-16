import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LangToggle from "./LangToggle";
import OpenBadge from "./OpenBadge";

export default async function Header() {
  const t = await getTranslations("brand");
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
        <Link href="/" className="flex items-center gap-2" aria-label={t("name")}>
          <Image src="/icons/logo.svg" alt="" width={40} height={40} priority unoptimized />
          <span className="hidden text-lg font-extrabold text-brand-blue min-[380px]:block">{t("name")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <OpenBadge />
          <LangToggle />
        </div>
      </div>
    </header>
  );
}
