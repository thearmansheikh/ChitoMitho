import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Gifts & flowers delivery in Dharan",
  description: "Send bouquets, cakes and gift sets in Dharan with a message card, on the date and time you choose. Order on WhatsApp.",
};
import TypeMenus from "@/components/shop/TypeMenus";
import GiftForm from "@/components/shop/GiftForm";

export default async function GiftsPage() {
  const t = await getTranslations("pages");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-brand-blue">{t("giftsTitle")}</h1>
      <TypeMenus type="gifts" />
      <GiftForm />
    </div>
  );
}
