"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { lineKey, useBasket, type BasketLine } from "@/context/BasketContext";
import { cleanOptions } from "@/lib/options";
import ItemSheet, { type SheetItem } from "./ItemSheet";

export default function AddToBasket({ line, available, label, item }: {
  line: Omit<BasketLine, "qty" | "note">;
  available: boolean;
  label: string; // localized item name, for screen readers
  /** Pass the item so one that has options (size, extras) opens its sheet instead of being added straight away. */
  item?: SheetItem;
}) {
  const t = useTranslations("common");
  const b = useTranslations("basket");
  const s = useTranslations("itemSheet");
  const { lines, add, setQty } = useBasket();
  const [sheet, setSheet] = useState(false);
  const key = lineKey(line);
  const qty = lines.find((l) => lineKey(l) === key)?.qty ?? 0;
  const hasOptions = !!item && cleanOptions(item.options).length > 0;

  if (!available) {
    return <span className="rounded-full bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">{t("soldOut")}</span>;
  }
  if (hasOptions && item) {
    return (
      <>
        <button
          type="button" onClick={() => setSheet(true)} aria-haspopup="dialog" aria-label={`${s("choose")}: ${label}`}
          className="inline-flex min-h-[44px] min-w-[88px] items-center justify-center gap-1 rounded-full bg-brand-red px-4 font-bold text-white shadow-md shadow-brand-red/30 transition active:scale-90"
        >
          {s("choose")}
        </button>
        {sheet && <ItemSheet item={item} line={line} placeType={line.placeType} tileText={line.name} onClose={() => setSheet(false)} />}
      </>
    );
  }
  if (qty === 0) {
    return (
      <button
        type="button" onClick={() => add(line)} aria-label={`${t("add")}: ${label}`}
        className="inline-flex min-h-[44px] min-w-[88px] items-center justify-center gap-1 rounded-full bg-brand-red px-4 font-bold text-white shadow-md shadow-brand-red/30 transition active:scale-90"
      >
        <span aria-hidden className="text-lg leading-none">+</span> {t("add")}
      </button>
    );
  }
  const step = "flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold text-white transition active:scale-90 hover:bg-white/15";
  return (
    <div className="flex items-center rounded-full bg-brand-blue shadow-md shadow-brand-blue/30">
      <button type="button" className={step} aria-label={`${b("decrease")}: ${label}`} onClick={() => setQty(key, qty - 1)}>−</button>
      <span className="min-w-[1.75rem] text-center text-lg font-bold text-white" aria-live="polite">{qty}</span>
      <button type="button" className={step} aria-label={`${b("increase")}: ${label}`} onClick={() => setQty(key, qty + 1)}>+</button>
    </div>
  );
}
