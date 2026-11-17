"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

/** Big search box on the home page. Sends the customer to the food list with their words already searched. */
export default function SearchBar() {
  const t = useTranslations("food");
  const router = useRouter();
  const [q, setQ] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const text = q.trim();
    router.push(text ? `/food?q=${encodeURIComponent(text)}` : "/food");
  }

  return (
    <form onSubmit={go} role="search" className="flex items-center gap-2 rounded-2xl bg-white p-2 pl-4 shadow-float ring-1 ring-slate-200">
      <span aria-hidden className="text-xl text-slate-400">🔍</span>
      <label htmlFor="home-search" className="sr-only">{t("searchLabel")}</label>
      <input
        id="home-search" value={q} onChange={(e) => setQ(e.target.value)} type="search" enterKeyHint="search"
        placeholder={t("searchPlaceholder")} autoComplete="off"
        className="min-h-[48px] min-w-0 flex-1 bg-transparent text-base placeholder:text-slate-400 focus:outline-none"
      />
      <button className="min-h-[48px] flex-none rounded-xl bg-brand-red px-5 font-bold text-white shadow-md shadow-brand-red/30 transition active:scale-95">
        {t("searchButton")}
      </button>
    </form>
  );
}
