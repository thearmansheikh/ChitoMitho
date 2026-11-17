"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useBasket } from "@/context/BasketContext";
import { formatNPR } from "@/lib/format";
import { pick } from "@/lib/names";
import { checkPromo, normalizeCode } from "@/lib/promo";
import type { Offer } from "@/types/db";

/** "Have a promo code?" The code is only passed on in the WhatsApp message; the team applies it. */
export default function PromoCode({ offers }: { offers: Offer[] }) {
  const t = useTranslations("promo");
  const locale = useLocale();
  const id = useId();
  const { extras, total, setPromo } = useBasket();
  const [input, setInput] = useState("");
  const [unknown, setUnknown] = useState(false);

  // Hide the whole box when there is nothing a customer could enter.
  if (offers.every((o) => !o.code) && !extras.promo) return null;

  const current = extras.promo ? checkPromo(offers, extras.promo, total) : null;

  function apply(e: React.FormEvent) {
    e.preventDefault();
    // A known code is kept even if the basket is below its minimum; the box then says how much is missing.
    if (!checkPromo(offers, input, total).offer) return setUnknown(true);
    setPromo(normalizeCode(input));
    setInput("");
    setUnknown(false);
  }

  if (current?.offer) {
    const title = pick(current.offer.title, current.offer.title_ne, locale);
    return (
      <div className={`flex items-start justify-between gap-3 rounded-xl border p-3 ${current.ok ? "border-green-300 bg-green-50" : "border-yellow-300 bg-yellow-50"}`}>
        <div className="min-w-0 text-sm">
          <p className="font-bold">
            <span className="font-mono tracking-widest">{normalizeCode(extras.promo)}</span> · {title}
          </p>
          <p className="mt-0.5 text-slate-700">
            {current.ok ? t("applied") : t("short", { amount: formatNPR(current.short) })}
          </p>
        </div>
        <button type="button" onClick={() => setPromo("")} className="min-h-[44px] flex-none px-2 text-sm font-semibold text-brand-red">
          {t("remove")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply} className="space-y-2 rounded-xl border border-slate-200 p-3">
      <label htmlFor={id} className="block text-sm font-semibold">{t("label")}</label>
      <div className="flex gap-2">
        <input
          id={id}
          value={input}
          onChange={(e) => { setInput(e.target.value); setUnknown(false); }}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder={t("placeholder")}
          className="min-h-[48px] min-w-0 flex-1 rounded-lg border border-slate-300 px-3 font-mono uppercase tracking-widest focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
        />
        <button className="min-h-[48px] flex-none rounded-lg bg-brand-blue px-4 font-bold text-white disabled:opacity-50" disabled={!input.trim()}>
          {t("apply")}
        </button>
      </div>
      {unknown && <p role="alert" className="text-sm font-semibold text-brand-red">{t("unknown")}</p>}
    </form>
  );
}
