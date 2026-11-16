import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Grocery delivery in Dharan",
  description: "Order groceries and vegetables in Dharan, Itahari and Biratnagar, or type your own shopping list. Order on WhatsApp.",
};
import TypeMenus from "@/components/shop/TypeMenus";
import ShoppingList from "@/components/shop/ShoppingList";

export default async function GroceriesPage() {
  const t = await getTranslations("pages");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-brand-blue">{t("groceriesTitle")}</h1>
      <ShoppingList />
      <TypeMenus type="grocery" />
    </div>
  );
}
