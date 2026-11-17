"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/** Shows a promo code as a tappable chip that copies it. */
export default function CopyCode({ code }: { code: string }) {
  const t = useTranslations("offers");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the code is still readable on the chip */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`${t("copy")}: ${code}`}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border-2 border-dashed border-brand-blue/60 px-3 font-mono text-base font-bold tracking-widest text-brand-blue active:bg-blue-50"
    >
      {code}
      <span aria-live="polite" className="font-sans text-xs font-semibold tracking-normal text-slate-600">
        {copied ? t("copied") : t("copy")}
      </span>
    </button>
  );
}
