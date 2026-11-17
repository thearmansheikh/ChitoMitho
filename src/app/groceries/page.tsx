import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import TypeMenus from "@/components/shop/TypeMenus";
import ShoppingList from "@/components/shop/ShoppingList";
import PageHeader from "@/components/ui/PageHeader";
import ServiceIcon from "@/components/ui/ServiceIcon";

export const metadata: Metadata = {
  title: "Grocery delivery in Dharan",
  description: "Order groceries and vegetables in Dharan, Itahari and Biratnagar, or type your own shopping list. Order on WhatsApp.",
};

export default async function GroceriesPage() {
  const t = await getTranslations("pages");
  const s = await getTranslations("serviceDesc");
  return (
    <div className="space-y-6">
      <PageHeader icon={<ServiceIcon name="grocery" className="h-9 w-9" />} tone="green" title={t("groceriesTitle")} subtitle={s("grocery")} />
      <ShoppingList />
      <TypeMenus type="grocery" searchable />
    </div>
  );
}
