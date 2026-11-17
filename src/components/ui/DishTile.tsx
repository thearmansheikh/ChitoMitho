import type { PlaceType } from "@/types/db";
import DishIcon, { DISH_TINT, dishFor, type DishName } from "./DishIcon";

const BY_TYPE: Record<PlaceType, DishName> = { food: "burger", grocery: "grocery", liquor: "beer", gifts: "bouquet" };

/** A tinted square with the right dish drawn on it. Used wherever an item has no photo. */
export default function DishTile({ text, type, className = "h-[72px] w-[72px]", iconClassName = "h-10 w-10" }: {
  /** Item name and category, used to choose the picture. */
  text: string;
  type: PlaceType;
  className?: string;
  iconClassName?: string;
}) {
  const dish = dishFor(text, type === "food" ? null : type === "grocery" ? "grocery" : type === "gifts" ? "gifts" : "liquor") ?? BY_TYPE[type];
  return (
    <div aria-hidden className={`flex flex-none items-center justify-center rounded-xl bg-gradient-to-br ${DISH_TINT[dish]} ${className}`}>
      <DishIcon name={dish} className={iconClassName} />
    </div>
  );
}
