import type { MetadataRoute } from "next";
import { getPlaces } from "@/lib/data";
import { hasMenu } from "@/lib/places";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = ["", "/food", "/groceries", "/liquor", "/gifts", "/parcel", "/anything", "/about", "/promise", "/partner", "/areas", "/help", "/privacy", "/terms"];
  const places = await getPlaces();
  return [
    ...fixed.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 })),
    ...places.filter(hasMenu).map((p) => ({ url: `${SITE_URL}/p/${p.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
  ];
}
