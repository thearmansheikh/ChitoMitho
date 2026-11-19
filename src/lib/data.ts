import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Area, Category, Closure, Item, Offer, Place, PlaceType, Settings } from "@/types/db";
import { nepalDates } from "./format";
import { liquorEnabledOf } from "./liquor";
import { DAY_NAMES, DAY_NAMES_NE, hoursFor, nepalWeekday, nextOpenHours, validWeekHours } from "./hours";
import {
  SAMPLE_OFFERS,
  SAMPLE_AREAS, SAMPLE_CATEGORIES, SAMPLE_ITEMS, SAMPLE_PLACES, SAMPLE_SETTINGS,
} from "./sample-data";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isConfigured = !!URL && !!KEY;

// Cookie-less anon client: public reads only, so results can be cached for everyone.
const sb = () => createClient(URL!, KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

const REVALIDATE = { revalidate: 60 };

/** Settings, with orders switched to "paused" while a holiday closure covers today (Nepal date). */
export const getSettings = unstable_cache(
  async (): Promise<Settings> => {
    if (!isConfigured) return SAMPLE_SETTINGS;
    const { data, error } = await sb().from("settings").select("*").eq("id", 1).maybeSingle();
    if (error) console.error("getSettings", error.message);
    let settings = (data as Settings | null) ?? { ...SAMPLE_SETTINGS, announcement: null };

    // Different hours on different weekdays: from here on open_time and close_time mean "today's hours".
    const week = validWeekHours(settings.weekday_hours);
    if (week) {
      const day = nepalWeekday();
      const h = hoursFor(week, day);
      const next = nextOpenHours(week, day);
      settings = { ...settings, open_time: h.open, close_time: h.close, tomorrow_open_time: next.open, tomorrow_close_time: next.close };
      if (h.closed && !settings.orders_paused) {
        settings = {
          ...settings,
          orders_paused: true,
          pause_message: `We are closed on ${DAY_NAMES[day]}s. We open again tomorrow.`,
          pause_message_ne: `हामी ${DAY_NAMES_NE[day]} बन्द हुन्छौं। भोलि फेरि खुल्छौं।`,
        };
      }
    }

    const today = nepalDates().today;
    const { data: closures, error: closureError } = await sb()
      .from("closures").select("*").lte("starts_on", today).gte("ends_on", today).order("ends_on", { ascending: false }).limit(1);
    // If the table is missing or unreadable the site keeps working with its normal settings.
    if (closureError) console.error("getSettings closures", closureError.message);
    const c = (closures as Closure[] | null)?.[0];
    if (!c) return settings;
    return {
      ...settings,
      orders_paused: true,
      pause_message: c.message?.trim() || `We are closed for ${c.reason}. Orders open again after ${c.ends_on}.`,
      pause_message_ne: c.message_ne?.trim() || null,
    };
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
    if (!isConfigured) return SAMPLE_PLACES.filter((p) => (!type || p.type === type) && (liquorEnabledOf(SAMPLE_SETTINGS) || p.type !== "liquor")).map((p) => ({ ...p, item_count: SAMPLE_ITEMS.filter((i) => i.place_id === p.id).length }));
    let q = sb().from("places").select("*").order("sort_order").order("name");
    if (type) q = q.eq("type", type);
    const { data, error } = await q;
    if (error) console.error("getPlaces", error.message);
    const places = (data as Place[]) ?? [];
    // How many items each place has, so a place with no menu can be shown as "Menu coming soon" (or hidden).
    const counts = new Map<string, number>();
    if (places.length > 0) {
      const { data: rows, error: countError } = await sb().from("items").select("place_id").in("place_id", places.map((p) => p.id)).limit(10000);
      if (countError) console.error("getPlaces counts", countError.message);
      for (const r of (rows as { place_id: string }[] | null) ?? []) counts.set(r.place_id, (counts.get(r.place_id) ?? 0) + 1);
    }
    const sellLiquor = liquorEnabledOf(await getSettings());
    return places.filter((p) => sellLiquor || p.type !== "liquor").map((p) => ({ ...p, item_count: counts.get(p.id) ?? 0 }));
  },
  ["places"],
  REVALIDATE,
);

export const getPlaceBySlug = unstable_cache(
  async (slug: string): Promise<Place | null> => {
    if (!isConfigured) return SAMPLE_PLACES.find((p) => p.slug === slug && (liquorEnabledOf(SAMPLE_SETTINGS) || p.type !== "liquor")) ?? null;
    const { data, error } = await sb().from("places").select("*").eq("slug", slug).maybeSingle();
    if (error) console.error("getPlaceBySlug", error.message);
    const place = (data as Place | null) ?? null;
    // While liquor is switched off its pages do not exist.
    if (place?.type === "liquor" && !liquorEnabledOf(await getSettings())) return null;
    return place;
  },
  ["place-by-slug"],
  REVALIDATE,
);

export interface FeaturedItem {
  item: Item;
  place: Place;
}

/** Items the team switched on for "Today's picks": in stock, at an active place. Empty until someone picks some. */
export const getFeatured = unstable_cache(
  async (): Promise<FeaturedItem[]> => {
    if (!isConfigured) {
      return SAMPLE_ITEMS.filter((i) => i.is_featured && i.is_available).flatMap((item) => {
        const place = SAMPLE_PLACES.find((p) => p.id === item.place_id);
        return place ? [{ item, place }] : [];
      });
    }
    const c = sb();
    const { data: items, error } = await c
      .from("items").select("*").eq("is_featured", true).eq("is_available", true).order("sort_order").limit(12);
    if (error) console.error("getFeatured", error.message);
    const list = (items as Item[]) ?? [];
    if (list.length === 0) return [];
    const { data: places } = await c.from("places").select("*").in("id", [...new Set(list.map((i) => i.place_id))]);
    const byId = new Map(((places as Place[]) ?? []).map((p) => [p.id, p]));
    const sellLiquor = liquorEnabledOf(await getSettings());
    return list.flatMap((item) => {
      const place = byId.get(item.place_id);
      if (place?.type === "liquor" && !sellLiquor) return [];
      return place ? [{ item: { ...item, price_npr: Number(item.price_npr) }, place }] : [];
    });
  },
  ["featured"],
  REVALIDATE,
);

export const getOffers = unstable_cache(
  async (): Promise<Offer[]> => {
    if (!isConfigured) return SAMPLE_OFFERS;
    // RLS already limits this to active offers inside their dates.
    const { data, error } = await sb().from("offers").select("*").order("sort_order").order("created_at");
    if (error) console.error("getOffers", error.message);
    return ((data as Offer[]) ?? []).map((o) => ({ ...o, min_order_npr: o.min_order_npr === null ? null : Number(o.min_order_npr) }));
  },
  ["offers"],
  REVALIDATE,
);

const UUID_RE =/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ItemStatus {
  id: string;
  price_npr: number;
  is_available: boolean;
}

/** Fresh (uncached) price and availability for items, used by "Order again". Missing = no longer sold. */
export async function getItemStatus(ids: string[]): Promise<ItemStatus[]> {
  if (ids.length === 0) return [];
  if (!isConfigured) {
    return SAMPLE_ITEMS.filter((i) => ids.includes(i.id)).map((i) => ({ id: i.id, price_npr: Number(i.price_npr), is_available: i.is_available }));
  }
  // Ids that are not UUIDs (e.g. left over from preview/sample data) can never match: treat as missing.
  const valid = ids.filter((i) => UUID_RE.test(i));
  if (valid.length === 0) return [];
  const { data, error } = await sb().from("items").select("id, price_npr, is_available").in("id", valid);
  if (error) throw new Error(error.message);
  return (data as ItemStatus[]) ?? [];
}

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
