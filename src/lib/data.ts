import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Area, Category, Item, Place, PlaceType, Settings } from "@/types/db";
import {
  SAMPLE_AREAS, SAMPLE_CATEGORIES, SAMPLE_ITEMS, SAMPLE_PLACES, SAMPLE_SETTINGS,
} from "./sample-data";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isConfigured = !!URL && !!KEY;

// Cookie-less anon client: public reads only, so results can be cached for everyone.
const sb = () => createClient(URL!, KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

const REVALIDATE = { revalidate: 60 };

export const getSettings = unstable_cache(
  async (): Promise<Settings> => {
    if (!isConfigured) return SAMPLE_SETTINGS;
    const { data, error } = await sb().from("settings").select("*").eq("id", 1).maybeSingle();
    if (error) console.error("getSettings", error.message);
    return (data as Settings | null) ?? { ...SAMPLE_SETTINGS, announcement: null };
  },
  ["settings"],
  REVALIDATE,
);

export const getAreas = unstable_cache(
  async (): Promise<Area[]> => {
    if (!isConfigured) return SAMPLE_AREAS;
    const { data, error } = await sb().from("areas").select("*").order("sort_order").order("name");
    if (error) console.error("getAreas", error.message);
    return (data as Area[]) ?? [];
  },
  ["areas"],
  REVALIDATE,
);

export const getPlaces = unstable_cache(
  async (type?: PlaceType): Promise<Place[]> => {
    if (!isConfigured) return SAMPLE_PLACES.filter((p) => !type || p.type === type);
    let q = sb().from("places").select("*").order("sort_order").order("name");
    if (type) q = q.eq("type", type);
    const { data, error } = await q;
    if (error) console.error("getPlaces", error.message);
    return (data as Place[]) ?? [];
  },
  ["places"],
  REVALIDATE,
);

export const getPlaceBySlug = unstable_cache(
  async (slug: string): Promise<Place | null> => {
    if (!isConfigured) return SAMPLE_PLACES.find((p) => p.slug === slug) ?? null;
    const { data, error } = await sb().from("places").select("*").eq("slug", slug).maybeSingle();
    if (error) console.error("getPlaceBySlug", error.message);
    return (data as Place | null) ?? null;
  },
  ["place-by-slug"],
  REVALIDATE,
);

export interface Menu {
  categories: Category[];
  items: Item[];
}

export const getMenu = unstable_cache(
  async (placeIds: string[]): Promise<Menu> => {
    if (placeIds.length === 0) return { categories: [], items: [] };
    if (!isConfigured) {
      return {
        categories: SAMPLE_CATEGORIES.filter((c) => placeIds.includes(c.place_id)),
        items: SAMPLE_ITEMS.filter((i) => placeIds.includes(i.place_id)),
      };
    }
    const c = sb();
    const [cats, items] = await Promise.all([
      c.from("categories").select("*").in("place_id", placeIds).order("sort_order"),
      c.from("items").select("*").in("place_id", placeIds).order("sort_order").order("name"),
    ]);
    if (cats.error || items.error) console.error("getMenu", cats.error?.message, items.error?.message);
    return { categories: (cats.data as Category[]) ?? [], items: (items.data as Item[]) ?? [] };
  },
  ["menu"],
  REVALIDATE,
);
