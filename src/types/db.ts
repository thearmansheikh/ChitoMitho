export type PlaceType = "food" | "grocery" | "liquor" | "gifts";
export type AreaGroup = "dharan" | "itahari" | "biratnagar" | "nearby";
export type Service = "food" | "grocery" | "liquor" | "gifts" | "parcel" | "anything";

export interface Place {
  id: string;
  name: string;
  name_ne: string | null;
  slug: string;
  type: PlaceType;
  logo_url: string | null;
  description: string | null;
  address: string | null;
  /** A Google Maps (or similar) web link to the place. */
  maps_url: string | null;
  cover_url: string | null;
  /** Own opening hours, "HH:MM:SS". Both null means "same as the shop". */
  opens_at: string | null;
  closes_at: string | null;
  is_active: boolean;
  sort_order: number;
}
export interface Category {
  id: string;
  place_id: string;
  name: string;
  name_ne: string | null;
  sort_order: number;
}
export interface Item {
  id: string;
  place_id: string;
  category_id: string | null;
  name: string;
  name_ne: string | null;
  description: string | null;
  price_npr: number;
  image_url: string | null;
  is_available: boolean;
  /** Shown in "Today's picks" on the home page. */
  is_featured: boolean;
  sort_order: number;
}
export interface Area {
  id: string;
  name: string;
  name_ne: string | null;
  area_group: AreaGroup;
  is_active: boolean;
  sort_order: number;
}
export interface Settings {
  id: 1;
  whatsapp_number: string;
  phone_numbers: string[];
  open_time: string;
  close_time: string;
  timezone: string;
  orders_paused: boolean;
  pause_message: string | null;
  /** Set only while a holiday closure is on: the Nepali version of pause_message. */
  pause_message_ne?: string | null;
  announcement: string | null;
  liquor_age_text: string | null;
}
export interface Closure {
  id: string;
  starts_on: string;
  ends_on: string;
  reason: string;
  message: string | null;
  message_ne: string | null;
  created_at: string;
}
export interface Offer {
  id: string;
  title: string;
  title_ne: string | null;
  body: string | null;
  body_ne: string | null;
  code: string | null;
  min_order_npr: number | null;
  starts_on: string | null;
  ends_on: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface OrderClick {
  id: string;
  service: Service;
  place_id: string | null;
  items_total_npr: number | null;
  area_id: string | null;
  created_at: string;
}
