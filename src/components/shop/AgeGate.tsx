"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const KEY = "cm-age-ok";

/** Age confirmation before showing liquor. The choice is remembered for the browser session only. */
export default function AgeGate({ text, children }: { text: string | null; children: React.ReactNode }) {
  const t = useTranslations("liquor");
  const c = useTranslations("common");
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    try { setOk(sessionStorage.getItem(KEY) === "1"); } catch { setOk(false); }
  }, []);

  if (ok === null) return null;
  if (ok) return <>{children}</>;

  return (
    <div role="dialog" aria-labelledby="age-title" className="mx-auto max-w-sm space-y-4 rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
      <p className="text-5xl" aria-hidden>🔞</p>
      <h2 id="age-title" className="text-2xl font-extrabold">{t("ageTitle")}</h2>
      <p className="text-slate-600">{text || t("ageDefault")}</p>
      <button type="button" className="min-h-[52px] w-full rounded-xl bg-brand-blue font-bold text-white"
        onClick={() => { try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ } setOk(true); }}>
        {t("ageYes")}
      </button>
      <Link href="/" className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-slate-300 font-bold">
        {t("ageNo")}
      </Link>
      <span className="sr-only">{c("back")}</span>
    </div>
  );
}
