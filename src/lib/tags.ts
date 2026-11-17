import { pick } from "./names";
import type { Category } from "@/types/db";

/** Names of a place's menu categories, in the customer's language, for the little chips on place cards. */
export function placeTags(placeId: string, categories: Category[], locale: string): string[] {
  return categories
    .filter((c) => c.place_id === placeId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => pick(c.name, c.name_ne, locale));
}
