import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSettings } from "@/lib/data";
import TypeMenus from "@/components/shop/TypeMenus";
import GiftForm from "@/components/shop/GiftForm";
import PageHeader from "@/components/ui/PageHeader";
import ServiceIcon from "@/components/ui/ServiceIcon";

export const metadata: Metadata = {
  title: "Gifts & flowers delivery in Dharan",
  description: "Send bouquets, cakes and gift sets in Dharan with a message card, on the date and time you choose. Order on WhatsApp.",
};

export default async function GiftsPage() {
  const t = await getTranslations("pages");
  const s = await getTranslations("serviceDesc");
  const settings = await getSettings();
  return (
    <div className="space-y-6">
      <PageHeader icon={<ServiceIcon name="gifts" className="h-9 w-9" />} tone="pink" title={t("giftsTitle")} subtitle={s("gifts")} />
      <TypeMenus type="gifts" />
      <GiftForm openTime={settings.open_time} closeTime={settings.close_time} />
    </div>
  );
}
