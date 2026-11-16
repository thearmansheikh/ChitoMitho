"use client";

import { useTranslations } from "next-intl";
import { useBasket } from "@/context/BasketContext";

const input =
  "w-full min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30";

export default function GiftForm() {
  const t = useTranslations("gifts");
  const { extras, setGift } = useBasket();
  const g = extras.gift;
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-4">
      <h2 className="text-lg font-bold">{t("detailsTitle")}</h2>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">{t("recipientName")}</span>
        <input className={input} value={g.recipientName} onChange={(e) => setGift({ recipientName: e.target.value })} autoComplete="off" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">{t("recipientPhone")}</span>
        <input className={input} type="tel" inputMode="numeric" value={g.recipientPhone} onChange={(e) => setGift({ recipientPhone: e.target.value })} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">{t("message")}</span>
        <textarea className={`${input} min-h-[96px]`} value={g.message} onChange={(e) => setGift({ message: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("date")}</span>
          <input className={input} type="date" value={g.date} onChange={(e) => setGift({ date: e.target.value })} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("time")}</span>
          <input className={input} type="time" value={g.time} onChange={(e) => setGift({ time: e.target.value })} />
        </label>
      </div>
    </div>
  );
}
