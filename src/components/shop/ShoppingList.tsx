"use client";

import { useTranslations } from "next-intl";
import { useBasket } from "@/context/BasketContext";

export default function ShoppingList() {
  const t = useTranslations("groceries");
  const { extras, setShoppingList } = useBasket();
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 p-4">
      <label htmlFor="shopping-list" className="block text-lg font-bold">{t("listTitle")}</label>
      <p className="text-sm text-slate-600">{t("listHelp")}</p>
      <textarea id="shopping-list" rows={5} value={extras.shoppingList} placeholder={t("listPlaceholder")}
        onChange={(e) => setShoppingList(e.target.value)}
        className="w-full rounded-lg border border-slate-300 p-3 text-base focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
    </div>
  );
}
