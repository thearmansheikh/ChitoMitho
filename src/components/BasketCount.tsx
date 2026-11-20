"use client";

import { useTranslations } from "next-intl";
import { useBasket } from "@/context/BasketContext";
import { formatNPR } from "@/lib/format";

/** Item count and running total next to the Basket button, so the customer always knows what they have. */
export default function BasketCount() {
  const { count, total, hydrated } = useBasket();
  const t = useTranslations("bar");
  if (!hydrated || count === 0) return null;
  return (
    <span className="ml-1 inline-flex items-center gap-2">
      {/* Read out in words; the number and amount below are only for the eyes. */}
      <span className="sr-only">, {t("contents", { count, total: formatNPR(total) })}</span>
      <span aria-hidden className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-brand-red px-1.5 text-sm font-bold text-white">
        {count}
      </span>
      <span aria-hidden className="text-sm font-semibold text-white/90">{formatNPR(total)}</span>
    </span>
  );
}
