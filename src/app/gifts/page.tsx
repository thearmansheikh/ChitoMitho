import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import TypeMenus from "@/components/shop/TypeMenus";
import GiftForm from "@/components/shop/GiftForm";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Gifts & flowers delivery in Dharan",
  description: "Send bouquets, cakes and gift sets in Dharan with a message card, on the date and time you choose. Order on WhatsApp.",
};

export default async function GiftsPage() {
  const t = await getTranslations("pages");
  const s = await getTranslations("serviceDesc");
  return (
    <div className="space-y-6">
      <PageHeader icon="💐" tone="pink" title={t("giftsTitle")} subtitle={s("gifts")} />
      <TypeMenus type="gifts" />
      <GiftForm />
    </div>
  );
}
