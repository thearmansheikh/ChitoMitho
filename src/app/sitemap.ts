import type { MetadataRoute } from "next";
import { getPlaces, getSettings } from "@/lib/data";
import { liquorEnabledOf } from "@/lib/liquor";
import { hasMenu } from "@/lib/places";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = ["", "/food", "/groceries", "/liquor", "/gifts", "/parcel", "/anything", "/about", "/promise", "/partner", "/areas", "/help", "/privacy", "/terms"];
  const places = await getPlaces();
  const liquorOn = liquorEnabledOf(await getSettings());
  return [
    ...fixed.filter((p) => p !== "/liquor" || liquorOn).map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 })),
    ...places.filter((p) => hasMenu(p) && (liquorOn || p.type !== "liquor")).map((p) => ({ url: `${SITE_URL}/p/${p.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
  ];
}
