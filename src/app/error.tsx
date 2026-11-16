"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div role="alert" className="space-y-4 py-10 text-center">
      <p className="text-6xl" aria-hidden>⚠️</p>
      <h1 className="text-2xl font-extrabold text-brand-red">{t("errorTitle")}</h1>
      <p className="mx-auto max-w-sm text-slate-600">{t("errorBody")}</p>
      <div className="mx-auto flex max-w-xs flex-col gap-2">
        <button type="button" onClick={reset} className="min-h-[52px] rounded-xl bg-brand-blue font-bold text-white">{t("retry")}</button>
        <Link href="/" className="flex min-h-[52px] items-center justify-center rounded-xl border border-slate-300 font-bold">{t("goHome")}</Link>
      </div>
    </div>
  );
}
