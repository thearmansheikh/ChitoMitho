import { getAreas, getSettings } from "@/lib/data";
import { toOrderConfig } from "@/lib/orderConfig";
import AnythingForm from "@/components/forms/AnythingForm";

export default async function AnythingPage() {
  const [settings, areas] = await Promise.all([getSettings(), getAreas()]);
  return <AnythingForm config={toOrderConfig(settings)} areas={areas} />;
}
