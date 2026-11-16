import { getAreas, getSettings } from "@/lib/data";
import { toOrderConfig } from "@/lib/orderConfig";
import BasketView from "@/components/shop/BasketView";

export default async function BasketPage() {
  const [settings, areas] = await Promise.all([getSettings(), getAreas()]);
  return <BasketView config={toOrderConfig(settings)} areas={areas} />;
}
