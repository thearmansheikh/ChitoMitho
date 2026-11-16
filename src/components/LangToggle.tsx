"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE } from "@/lib/locale";

export default function LangToggle() {
  const locale = useLocale();
  const t = useTranslations("header");
  const router = useRouter();

  function set(l: "en" | "ne") {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  const base = "min-h-[40px] px-3 text-sm font-semibold transition-colors";
  return (
    <div role="group" aria-label={t("langToggle")} className="flex overflow-hidden rounded-full border border-brand-blue">
      <button type="button" onClick={() => set("en")} aria-pressed={locale === "en"}
        className={`${base} ${locale === "en" ? "bg-brand-blue text-white" : "text-brand-blue"}`}>EN</button>
      <button type="button" onClick={() => set("ne")} aria-pressed={locale === "ne"}
        className={`${base} ${locale === "ne" ? "bg-brand-blue text-white" : "text-brand-blue"}`}>नेपाली</button>
    </div>
  );
}
