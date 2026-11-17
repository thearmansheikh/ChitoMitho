import type { Metadata } from "next";
import { getAreas, getOffers, getSettings } from "@/lib/data";
import { toOrderConfig } from "@/lib/orderConfig";
import BasketView from "@/components/shop/BasketView";

export const metadata: Metadata = { title: "Your basket", robots: { index: false } };

export default async function BasketPage() {
  const [settings, areas, offers] = await Promise.all([getSettings(), getAreas(), getOffers()]);
  return <BasketView config={toOrderConfig(settings)} areas={areas} offers={offers} />;
}
