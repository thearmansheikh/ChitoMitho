import type { Metadata } from "next";
import { getAreas, getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Your basket", robots: { index: false } };
import { toOrderConfig } from "@/lib/orderConfig";
import BasketView from "@/components/shop/BasketView";

export default async function BasketPage() {
  const [settings, areas] = await Promise.all([getSettings(), getAreas()]);
  return <BasketView config={toOrderConfig(settings)} areas={areas} />;
}
