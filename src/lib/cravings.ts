import type { DishName } from "@/components/ui/DishIcon";

export interface Craving {
  key: string;
  dish: DishName;
  /** What a tap searches for. English first so it matches menus written in English. */
  q: string;
}

/** The "What are you craving?" shortcuts, shown on the home page and above the food list. */
export const CRAVINGS: Craving[] = [
  { key: "momo", dish: "momo", q: "momo" },
  { key: "burger", dish: "burger", q: "burger" },
  { key: "pizza", dish: "pizza", q: "pizza" },
  { key: "coffee", dish: "coffee", q: "coffee" },
  { key: "noodles", dish: "noodles", q: "noodle" },
  { key: "rice", dish: "rice", q: "rice" },
  { key: "cake", dish: "cake", q: "cake" },
  { key: "drink", dish: "drink", q: "drink" },
];
