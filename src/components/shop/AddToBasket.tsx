"use client";

import { useTranslations } from "next-intl";
import { useBasket, type BasketLine } from "@/context/BasketContext";

export default function AddToBasket({ line, available, label }: {
  line: Omit<BasketLine, "qty" | "note">;
  available: boolean;
  label: string; // localized item name, for screen readers
}) {
  const t = useTranslations("common");
  const b = useTranslations("basket");
  const { lines, add, setQty } = useBasket();
  const qty = lines.find((l) => l.itemId === line.itemId)?.qty ?? 0;

  if (!available) {
    return <span className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">{t("soldOut")}</span>;
  }
  if (qty === 0) {
    return (
      <button type="button" onClick={() => add(line)} aria-label={`${t("add")}: ${label}`}
        className="min-h-[44px] min-w-[84px] rounded-lg bg-brand-red px-4 font-bold text-white active:scale-95">
        {t("add")}
      </button>
    );
  }
  const step = "flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-xl font-bold text-brand-blue";
  return (
    <div className="flex items-center gap-1">
      <button type="button" className={step} aria-label={`${b("decrease")}: ${label}`} onClick={() => setQty(line.itemId, qty - 1)}>−</button>
      <span className="min-w-[2rem] text-center text-lg font-bold" aria-live="polite">{qty}</span>
      <button type="button" className={step} aria-label={`${b("increase")}: ${label}`} onClick={() => setQty(line.itemId, qty + 1)}>+</button>
    </div>
  );
}
