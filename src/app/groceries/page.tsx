import { getTranslations } from "next-intl/server";
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
