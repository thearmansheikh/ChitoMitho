"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useBasket } from "@/context/BasketContext";

/** The end of the gifts page: one clear button that takes the gift basket to the order details. */
export default function GiftOrderButton() {
  const t = useTranslations("gifts");
  const router = useRouter();
  const { count, hydrated } = useBasket();
  const empty = hydrated && count === 0;
  return (
    <div className="space-y-2">
      <button
        type="button" disabled={empty} onClick={() => router.push("/basket?order=1")}
        className="min-h-[56px] w-full rounded-xl bg-green-700 text-lg font-bold text-white disabled:opacity-50"
      >
        💬 {t("orderButton")}
      </button>
      <p className="text-center text-sm text-slate-600">{empty ? t("orderEmpty") : t("orderHelp")}</p>
    </div>
  );
}
