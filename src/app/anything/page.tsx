import type { Metadata } from "next";
import { getAreas, getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Order anything, from anywhere in Dharan",
  description: "Need something from any shop in Dharan? Tell us what and where, and a rider will buy and deliver it. Order on WhatsApp.",
};
import { toOrderConfig } from "@/lib/orderConfig";
import AnythingForm from "@/components/forms/AnythingForm";

export default async function AnythingPage() {
  const [settings, areas] = await Promise.all([getSettings(), getAreas()]);
  return <AnythingForm config={toOrderConfig(settings)} areas={areas} />;
}
