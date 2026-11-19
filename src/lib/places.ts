import type { Place, Settings } from "@/types/db";

export type NoMenuMode = "badge" | "hide";

/** Places with no menu yet: show them with a "Menu coming soon" badge (default), or hide them. */
export function noMenuModeOf(s: Pick<Settings, "places_without_menu">): NoMenuMode {
  return s.places_without_menu === "hide" ? "hide" : "badge";
}

/** A place has a menu when it has at least one item. A place whose count is unknown counts as having one. */
export function hasMenu(p: Pick<Place, "item_count">): boolean {
  return p.item_count === undefined || p.item_count > 0;
}

/** The places a visitor may see: all of them, or only those with a menu when the team chose to hide the rest. */
export function visiblePlaces<T extends Pick<Place, "item_count">>(places: T[], mode: NoMenuMode): T[] {
  return mode === "hide" ? places.filter(hasMenu) : places;
}
