"use client";

import { useBasket } from "@/context/BasketContext";
import { formatNPR } from "@/lib/format";

/** Item count and running total next to the Basket button, so the customer always knows what they have. */
export default function BasketCount() {
  const { count, total, hydrated } = useBasket();
  if (!hydrated || count === 0) return null;
  return (
    <span className="ml-1 inline-flex items-center gap-2">
      <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-brand-red px-1.5 text-sm font-bold text-white">
        {count}
      </span>
      <span className="text-sm font-semibold text-white/90">{formatNPR(total)}</span>
    </span>
  );
}
