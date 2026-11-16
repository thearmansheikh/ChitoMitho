import { getAreas, getSettings } from "@/lib/data";
import { toOrderConfig } from "@/lib/orderConfig";
import ParcelForm from "@/components/forms/ParcelForm";

export default async function ParcelPage() {
  const [settings, areas] = await Promise.all([getSettings(), getAreas()]);
  return <ParcelForm config={toOrderConfig(settings)} areas={areas} />;
}
