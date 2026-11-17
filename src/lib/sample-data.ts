// Shown only when Supabase env vars are missing (local preview). Mirrors 0002_seed.sql.
import type { Area, Category, Item, Offer, Place, Settings } from "@/types/db";

export const SAMPLE_OFFERS: Offer[] = [
  {
    id: "o-sample", title: "Free delivery on your first order", title_ne: "पहिलो अर्डरमा निःशुल्क डेलिभरी",
    body: "Sample offer for the preview.", body_ne: null, code: "FIRST", min_order_npr: null,
    starts_on: null, ends_on: null, is_active: true, sort_order: 1,
  },
];

export const SAMPLE_SETTINGS: Settings = {
  id: 1,
  whatsapp_number: "9805338257",
  phone_numbers: ["9705468562", "9805338257"],
  open_time: "10:00",
  close_time: "22:00",
  timezone: "Asia/Kathmandu",
  orders_paused: false,
  pause_message: null,
  announcement: "Preview mode: showing sample menus.",
  liquor_age_text: "You must be 18 or older. ID will be checked at the door.",
};

const place = (id: string, name: string, slug: string, type: Place["type"], description: string, sort_order: number, name_ne: string | null = null): Place => ({
  id, name, name_ne, slug, type, logo_url: null, description, address: null, maps_url: null, cover_url: null,
  opens_at: null, closes_at: null, is_active: true, sort_order,
});

export const SAMPLE_PLACES: Place[] = [
  place("p-olive", "Olive Cafe", "olive-cafe", "food", "Momo, coffee and snacks", 1),
  place("p-circle", "Circle Cafe", "circle-cafe", "food", "Burgers, pizza and drinks", 2),
  place("p-siblings", "Siblings", "siblings", "food", "Meals and fast food", 3),
  place("p-grocery", "Chitto Mitho Grocery", "grocery", "grocery", "Daily groceries", 1),
  place("p-drinks", "Chitto Mitho Drinks", "drinks", "liquor", "Beer, wine and spirits (18+)", 1),
  place("p-gifts", "Gifts & Flowers", "gifts", "gifts", "Bouquets, cakes and gift sets", 1),
];

const cat = (id: string, place_id: string, name: string, name_ne: string, sort_order: number): Category => ({ id, place_id, name, name_ne, sort_order });

export const SAMPLE_CATEGORIES: Category[] = [
  cat("c-momo", "p-olive", "Momo", "मोमो", 1),
  cat("c-drinks", "p-olive", "Drinks", "पेय", 2),
  cat("c-burgers", "p-circle", "Burgers", "बर्गर", 1),
  cat("c-meals", "p-siblings", "Meals", "खाना", 1),
  cat("c-rice", "p-grocery", "Rice & Grains", "चामल र अन्न", 1),
  cat("c-veg", "p-grocery", "Vegetables", "तरकारी", 2),
  cat("c-beer", "p-drinks", "Beer", "बियर", 1),
  cat("c-bouquets", "p-gifts", "Bouquets", "गुच्छा", 1),
  cat("c-cakes", "p-gifts", "Cakes", "केक", 2),
];

const item = (id: string, place_id: string, category_id: string, name: string, name_ne: string, price_npr: number, is_available = true, is_featured = false): Item => ({
  id, place_id, category_id, name, name_ne, description: null, price_npr, image_url: null, is_available, is_featured, sort_order: 0,
});

export const SAMPLE_ITEMS: Item[] = [
  item("i-cmomo", "p-olive", "c-momo", "Chicken Momo", "चिकेन मोमो", 250, true, true),
  item("i-vmomo", "p-olive", "c-momo", "Veg Momo", "भेज मोमो", 200, false),
  item("i-coffee", "p-olive", "c-drinks", "Cold Coffee", "कोल्ड कफी", 180),
  item("i-burger", "p-circle", "c-burgers", "Chicken Burger", "चिकेन बर्गर", 320, true, true),
  item("i-rice", "p-siblings", "c-meals", "Chicken Fried Rice", "चिकेन फ्राइड राइस", 280),
  item("i-rice5", "p-grocery", "c-rice", "Rice 5kg", "चामल ५ केजी", 900),
  item("i-tomato", "p-grocery", "c-veg", "Tomato 1kg", "गोलभेडा १ केजी", 80),
  item("i-beer", "p-drinks", "c-beer", "Beer 650ml", "बियर ६५० एमएल", 450),
  item("i-roses", "p-gifts", "c-bouquets", "Red Rose Bouquet", "रातो गुलाफको गुच्छा", 1500, true, true),
  item("i-cake", "p-gifts", "c-cakes", "Chocolate Cake 1lb", "चकलेट केक १ पाउन्ड", 1200),
];

const area = (id: string, name: string, name_ne: string, area_group: Area["area_group"], sort_order: number): Area => ({ id, name, name_ne, area_group, is_active: true, sort_order });

export const SAMPLE_AREAS: Area[] = [
  area("a-bhanu", "Bhanu Chowk", "भानु चोक", "dharan", 1),
  area("a-bp", "BP Chowk", "बीपी चोक", "dharan", 2),
  area("a-putali", "Putali Line", "पुतली लाइन", "dharan", 3),
  area("a-bajhogara", "Bajhogara", "बझोगरा", "dharan", 4),
  area("a-itahari", "Itahari", "इटहरी", "itahari", 1),
  area("a-biratnagar", "Biratnagar", "विराटनगर", "biratnagar", 1),
  area("a-duhabi", "Duhabi", "दुहबी", "nearby", 1),
  area("a-inaruwa", "Inaruwa", "इनरुवा", "nearby", 2),
];

// Preview mode only: one café shows an address, a map link and its own hours so the page can be previewed.
SAMPLE_PLACES[0] = {
  ...SAMPLE_PLACES[0],
  address: "Bhanu Chowk, near Nabil Bank, Dharan",
  maps_url: "https://maps.google.com/?q=Bhanu+Chowk+Dharan",
  opens_at: "09:00:00",
  closes_at: "21:00:00",
};
