import type { Metadata } from "next";
import { getAreas, getOffers, getSettings } from "@/lib/data";
import { toOrderConfig } from "@/lib/orderConfig";
import BasketView from "@/components/shop/BasketView";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Your basket",
  path: "/basket",
  description: "Your Chitto Mitho basket. Check your items and send the order on WhatsApp.",
  noindex: true
});

export default async function BasketPage() {
  const [settings, areas, offers] = await Promise.all([getSettings(), getAreas(), getOffers()]);
  return <BasketView config={toOrderConfig(settings)} areas={areas} offers={offers} />;
}
