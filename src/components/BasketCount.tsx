"use client";

import { useBasket } from "@/context/BasketContext";

export default function BasketCount() {
  const { count, hydrated } = useBasket();
  if (!hydrated || count === 0) return null;
  return (
    <span className="ml-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-brand-red px-1.5 text-sm font-bold text-white">
      {count}
    </span>
  );
}
