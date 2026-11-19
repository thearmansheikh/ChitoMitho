"use client";

import Image from "next/image";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { BasketLine } from "@/context/BasketContext";
import { formatNPR } from "@/lib/format";
import { pick } from "@/lib/names";
import { cleanOptions } from "@/lib/options";
import type { PlaceType } from "@/types/db";
import DishTile from "@/components/ui/DishTile";
import AddToBasket from "./AddToBasket";
import ItemSheet, { type SheetItem } from "./ItemSheet";

/** One menu item. Tapping the picture or name opens its detail sheet; the button on the right adds it. */
export default function ItemRow({ item, line, placeType, tileText }: {
  item: SheetItem;
  line: Omit<BasketLine, "qty" | "note">;
  placeType: PlaceType;
  tileText: string;
}) {
  const locale = useLocale();
  const t = useTranslations("itemSheet");
  const c = useTranslations("common");
  const [open, setOpen] = useState(false);
  const name = pick(item.name, item.name_ne, locale);
  const available = item.is_available;
  const hasOptions = cleanOptions(item.options).length > 0;

  return (
    <li className={`flex items-center gap-3 rounded-2xl p-3.5 ring-1 ${available ? "bg-white shadow-card ring-slate-200/70" : "bg-slate-100 ring-slate-200"}`}>
      <button
        type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`${t("details")}: ${name}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left"
      >
        {item.image_url ? (
          <Image src={item.image_url} alt="" width={72} height={72} loading="lazy" className={`h-[72px] w-[72px] flex-none rounded-xl object-cover ${available ? "" : "opacity-50 grayscale"}`} />
        ) : (
          <DishTile text={tileText} type={placeType} className={`h-[72px] w-[72px] ${available ? "" : "opacity-50 grayscale"}`} />
        )}
        <span className="min-w-0 flex-1">
          <span className={`block font-bold leading-snug ${available ? "" : "text-slate-600 line-through"}`}>{name}</span>{" "}
          {item.unit && <><span className="block text-sm font-semibold text-slate-600">{item.unit}</span>{" "}</>}
          {item.description && <><span className="mt-0.5 line-clamp-2 block text-sm text-slate-600">{item.description}</span>{" "}</>}
          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-sm font-bold ${available ? "bg-blue-50 text-brand-blue" : "bg-slate-200 text-slate-600"}`}>
            <span className="sr-only">{c("price")}: </span>{hasOptions ? `${t("from")} ` : ""}{formatNPR(line.price)}
          </span>
        </span>
      </button>{" "}
      <AddToBasket available={available} label={name} line={line} item={item} />
      {open && <ItemSheet item={item} line={line} placeType={placeType} tileText={tileText} onClose={() => setOpen(false)} />}
    </li>
  );
}
