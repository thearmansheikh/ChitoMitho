"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/** Shares the page with the phone's own share sheet, or copies the link where that is not available. */
export default function ShareButton({ title }: { title: string }) {
  const t = useTranslations("placeInfo");
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* the customer closed the share sheet, or the browser blocked copying: nothing to do */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-brand-blue shadow-card ring-1 ring-slate-200 transition active:scale-95"
    >
      <span aria-hidden>↗</span>
      <span aria-live="polite">{copied ? t("copied") : t("share")}</span>
    </button>
  );
}
