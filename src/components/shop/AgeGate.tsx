"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AGE_KEY } from "@/lib/liquor";

/** Age confirmation before showing liquor. The answer is remembered on this device (not on our servers). */
export default function AgeGate({ text, children }: { text: string | null; children: React.ReactNode }) {
  const t = useTranslations("liquor");
  const c = useTranslations("common");
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    try { setOk(localStorage.getItem(AGE_KEY) === "1"); } catch { setOk(false); }
  }, []);

  // Until we know, show nothing: the items never flash before the gate does.
  if (ok === null) return <p className="sr-only" aria-live="polite">{t("ageTitle")}</p>;
  if (ok) return <>{children}</>;

  return (
    <div role="dialog" aria-labelledby="age-title" className="mx-auto max-w-sm space-y-4 rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
      <p className="text-5xl" aria-hidden>🔞</p>
      <h2 id="age-title" className="text-2xl font-extrabold">{t("ageTitle")}</h2>
      <p className="text-slate-600">{text || t("ageDefault")}</p>
      <p className="font-bold text-brand-red">{t("ageNote")}</p>
      <button type="button" className="min-h-[52px] w-full rounded-xl bg-brand-blue font-bold text-white"
        onClick={() => { try { localStorage.setItem(AGE_KEY, "1"); } catch { /* ignore */ } setOk(true); }}>
        {t("ageYes")}
      </button>
      <Link href="/" className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-slate-300 font-bold">
        {t("ageNo")}
      </Link>
      <span className="sr-only">{c("back")}</span>
    </div>
  );
}
