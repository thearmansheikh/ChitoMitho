import ServiceIcon, { type ServiceIconName } from "./ServiceIcon";

export type DishName = "momo" | "burger" | "pizza" | "coffee" | "noodles" | "rice" | "cake" | "drink" | "beer" | "bouquet" | "grocery";

/** Pick the best picture for a menu item from its name (English or Nepali). */
export function dishFor(text: string, fallback: ServiceIconName | null = null): DishName | null {
  const s = text.toLowerCase();
  const has = (...w: string[]) => w.some((x) => s.includes(x));
  if (has("momo", "dumpling", "मोमो")) return "momo";
  if (has("burger", "बर्गर", "sandwich", "fries")) return "burger";
  if (has("pizza", "पिज्जा")) return "pizza";
  if (has("coffee", "latte", "cappuccino", "espresso", "tea", "चिया", "कफी", "चिया")) return "coffee";
  if (has("noodle", "chowmein", "chow mein", "thukpa", "ramen", "pasta", "चाउमिन", "चाउचाउ", "थुक्पा")) return "noodles";
  if (has("biryani", "rice", "pulao", "thali", "भात", "बिरियानी", "खाजा")) return "rice";
  if (has("cake", "pastry", "dessert", "brownie", "ice cream", "केक")) return "cake";
  if (has("beer", "wine", "whisky", "whiskey", "vodka", "rum", "बियर", "रक्सी")) return "beer";
  if (has("juice", "shake", "smoothie", "cola", "coke", "soda", "lassi", "drink", "पेय")) return "drink";
  if (has("rose", "bouquet", "flower", "गुलाफ", "गुच्छा")) return "bouquet";
  if (fallback === "grocery") return "grocery";
  if (fallback === "gifts") return "bouquet";
  if (fallback === "liquor") return "beer";
  return null;
}

/** Soft background colour that suits each dish, so thumbnails look intentional even without photos. */
export const DISH_TINT: Record<DishName, string> = {
  momo: "from-amber-100 to-orange-50",
  burger: "from-red-100 to-amber-50",
  pizza: "from-yellow-100 to-red-50",
  coffee: "from-stone-200 to-amber-50",
  noodles: "from-red-100 to-yellow-50",
  rice: "from-yellow-100 to-lime-50",
  cake: "from-pink-100 to-rose-50",
  drink: "from-sky-100 to-cyan-50",
  beer: "from-amber-100 to-yellow-50",
  bouquet: "from-rose-100 to-pink-50",
  grocery: "from-emerald-100 to-lime-50",
};

/** Hand-drawn flat dish pictures in the site palette. A few hundred bytes each, so they cost nothing in speed. */
export default function DishIcon({ name, className = "h-10 w-10" }: { name: DishName; className?: string }) {
  if (name === "burger") return <ServiceIcon name="food" className={className} />;
  if (name === "beer") return <ServiceIcon name="liquor" className={className} />;
  if (name === "bouquet") return <ServiceIcon name="gifts" className={className} />;
  if (name === "grocery") return <ServiceIcon name="grocery" className={className} />;

  return (
    <svg aria-hidden viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {name === "momo" && (
        <>
          <path d="M5 37c0-3 8-5 19-5s19 2 19 5-8 6-19 6S5 40 5 37z" fill="#C98A4B" />
          <path d="M5 37c0 3 8 6 19 6s19-3 19-6" stroke="#A8702F" strokeWidth="1.5" />
          <path d="M9 31c0-8 6-14 15-14s15 6 15 14c0 2-1.5 3-3.5 3h-23C10.5 34 9 33 9 31z" fill="#F7E8C8" />
          <path d="M16 20.5c1.2 3 1.4 6.5 0 10M21 18.5c1 3.4 1.2 7.8 0 12.5M27 18.5c-1 3.4-1.2 7.8 0 12.5M32 20.5c-1.2 3-1.4 6.5 0 10" stroke="#D9BF8F" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="41" cy="14" r="4" fill="#D62828" />
          <path d="M40 10c.5-1.8 2-2.6 3.5-2.2" stroke="#4CB36B" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {name === "pizza" && (
        <>
          <path d="M24 43 6 13c6-5 12-7 18-7s12 2 18 7z" fill="#F6C453" />
          <path d="M6 13c6-5 12-7 18-7s12 2 18 7" stroke="#E4A030" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="19" cy="17" r="3.4" fill="#D62828" />
          <circle cx="29.5" cy="19" r="3.4" fill="#D62828" />
          <circle cx="24" cy="29" r="3.2" fill="#D62828" />
          <circle cx="14" cy="23" r="1.4" fill="#2F6B3A" />
          <circle cx="33" cy="26" r="1.4" fill="#2F6B3A" />
          <circle cx="23" cy="22" r="1.3" fill="#2F6B3A" />
        </>
      )}
      {name === "coffee" && (
        <>
          <path d="M16 6c-2 3 2 4 0 7M23 5c-2 3 2 4 0 8M30 6c-2 3 2 4 0 7" stroke="#9AA8C4" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 19h26v10c0 6-5 11-13 11S9 35 9 29z" fill="#fff" stroke="#D5DCEA" strokeWidth="1.5" />
          <ellipse cx="22" cy="19" rx="13" ry="3.2" fill="#8B5A3C" />
          <path d="M35 22h2.5c3 0 4.5 2 4.5 4.5S40.500 31 37.500 31H34" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="22" cy="43" rx="17" ry="2.6" fill="#E3E9F4" />
        </>
      )}
      {name === "noodles" && (
        <>
          <path d="M9 17c3-6 5 3 8-1s4-5 7-1 5 5 8 0 4-4 6 0" stroke="#F4C75E" strokeWidth="3" strokeLinecap="round" />
          <path d="M11 21c3-5 5 2 8-1s4-4 7 0 5 4 8-.5 3-3 5 0" stroke="#F4C75E" strokeWidth="3" strokeLinecap="round" />
          <path d="M5 24h38c0 11-8 18-19 18S5 35 5 24z" fill="#D62828" />
          <path d="M5 24h38" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
          <path d="M30 5l9 15M35 4l8 14" stroke="#8B5A3C" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {name === "rice" && (
        <>
          <ellipse cx="24" cy="38" rx="21" ry="5.5" fill="#E3E9F4" />
          <path d="M8 36c0-13 8-21 16-21s16 8 16 21z" fill="#F7E9B8" />
          <circle cx="17" cy="28" r="1.6" fill="#F2A33A" />
          <circle cx="24" cy="23" r="1.6" fill="#F2A33A" />
          <circle cx="30" cy="29" r="1.6" fill="#F2A33A" />
          <circle cx="21" cy="32" r="1.4" fill="#F2A33A" />
          <circle cx="28" cy="20" r="1.3" fill="#D62828" />
          <path d="M33 14c4-5 9-4 10 0-4 3-8 3-10 0z" fill="#4CB36B" />
        </>
      )}
      {name === "cake" && (
        <>
          <path d="M23.500 5c1.500 2 .5 3.500 0 4.500-1-1-1.500-2.500 0-4.500z" fill="#FFC857" />
          <rect x="22.500" y="9" width="2" height="6" rx="1" fill="#2E5A9C" />
          <rect x="8" y="26" width="32" height="14" rx="3" fill="#8B5A3C" />
          <rect x="8" y="17" width="32" height="10" rx="3" fill="#FFE3EC" />
          <path d="M8 24c3 3 5-1 8 1s5-2 8 0 5-2 8 0 5-1 8 0v-4H8z" fill="#F7A8C4" />
          <circle cx="16" cy="32" r="1.4" fill="#FFE3EC" />
          <circle cx="24" cy="34" r="1.4" fill="#FFE3EC" />
          <circle cx="32" cy="32" r="1.4" fill="#FFE3EC" />
        </>
      )}
      {name === "drink" && (
        <>
          <path d="M28 4l-4 16" stroke="#D62828" strokeWidth="3" strokeLinecap="round" />
          <path d="M12 14h24l-3.500 27c-.2 1.500-1.400 2.500-3 2.500H18.500c-1.600 0-2.800-1-3-2.500z" fill="#F9A03F" />
          <path d="M12.500 18h23" stroke="#fff" strokeOpacity=".55" strokeWidth="2" />
          <rect x="17" y="24" width="6" height="6" rx="1.500" fill="#fff" fillOpacity=".5" transform="rotate(-10 20 27)" />
          <rect x="25" y="29" width="6" height="6" rx="1.500" fill="#fff" fillOpacity=".5" transform="rotate(12 28 32)" />
          <circle cx="12" cy="13" r="5" fill="#9BD05C" />
          <circle cx="12" cy="13" r="3" fill="#C9E88F" />
        </>
      )}
    </svg>
  );
}
