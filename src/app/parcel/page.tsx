import type { Metadata } from "next";
import { getAreas, getSettings } from "@/lib/data";

export const metadata: Metadata = pageMeta({
  title: "Parcel pick and drop in Dharan",
  path: "/parcel",
  description: "Send a parcel anywhere in Dharan, Itahari or Biratnagar. Tell us the pickup and drop place and we handle the rest. Order on WhatsApp."
});
import { toOrderConfig } from "@/lib/orderConfig";
import ParcelForm from "@/components/forms/ParcelForm";
import { pageMeta } from "@/lib/seo";

export default async function ParcelPage() {
  const [settings, areas] = await Promise.all([getSettings(), getAreas()]);
  return <ParcelForm config={toOrderConfig(settings)} areas={areas} />;
}
