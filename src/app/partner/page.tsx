import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import PartnerForm from "@/components/forms/PartnerForm";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Partner with us: list your café or ride",
  path: "/partner",
  description: "Own a café, restaurant or shop in Dharan? Get listed on Chitto Mitho and reach more customers. Riders can apply too. Send your details on WhatsApp."
});

export default async function PartnerPage() {
  const s = await getSettings();
  return <PartnerForm whatsapp={s.whatsapp_number} />;
}
