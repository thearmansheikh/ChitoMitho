"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useBasket, type BasketLine, type LineOption } from "@/context/BasketContext";
import { formatNPR } from "@/lib/format";
import { pick } from "@/lib/names";
import { cleanOptions } from "@/lib/options";
import type { PlaceType } from "@/types/db";
import DishTile from "@/components/ui/DishTile";

export interface SheetItem {
  name: string;
  name_ne: string | null;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  options?: unknown;
}

/** The detail view of one item: big picture, full description, choices (size, extras), a note and a quantity. */
export default function ItemSheet({ item, line, placeType, tileText, onClose }: {
  item: SheetItem;
  /** The plain line for this item. line.price is the item's own price. */
  line: Omit<BasketLine, "qty" | "note">;
  placeType: PlaceType;
  /** Text used to pick a drawn picture when the item has no photo. */
  tileText: string;
  onClose: () => void;
}) {
  const t = useTranslations("itemSheet");
  const c = useTranslations("common");
  const locale = useLocale();
  const { add } = useBasket();
  const groups = useMemo(() => cleanOptions(item.options), [item.options]);

  // Chosen choice indexes per group. A required single-choice group starts on its first choice.
  const [picked, setPicked] = useState<number[][]>(() => groups.map((g) => (g.required && !g.multi ? [0] : [])));
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  // Keep focus inside the sheet, close on Escape, lock page scroll, and give focus back when it closes.
  useEffect(() => {
    opener.current = document.activeElement;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, []);

  const name = pick(item.name, item.name_ne, locale);
  const unit = line.price + groups.reduce((sum, g, gi) => sum + picked[gi].reduce((n, ci) => n + g.choices[ci].price, 0), 0);
  const total = unit * qty;

  function toggle(gi: number, ci: number) {
    setError(null);
    setPicked((p) => p.map((sel, i) => {
      if (i !== gi) return sel;
      if (!groups[gi].multi) return [ci];
      return sel.includes(ci) ? sel.filter((x) => x !== ci) : [...sel, ci];
    }));
  }

  function submit() {
    for (let gi = 0; gi < groups.length; gi++) {
      if (groups[gi].required && picked[gi].length === 0) {
        return setError(t("needChoice", { group: pick(groups[gi].name, groups[gi].name_ne, locale) }));
      }
    }
    const options: LineOption[] = groups.flatMap((g, gi) =>
      picked[gi].slice().sort((a, b) => a - b).map((ci) => ({
        group: g.name, groupNe: g.name_ne ?? null, choice: g.choices[ci].name, choiceNe: g.choices[ci].name_ne ?? null, price: g.choices[ci].price,
      })),
    );
    const key = options.length ? `${line.itemId}~${options.map((o) => `${o.group}:${o.choice}`).join("|")}` : undefined;
    add(
      options.length ? { ...line, key, price: unit, basePrice: line.price, options } : line,
      { qty, note },
    );
    onClose();
  }

  const step = "flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold text-white transition active:scale-90 hover:bg-white/15";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-labelledby="item-sheet-title" onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-2xl"
      >
        <div className="relative">
          {item.image_url ? (
            <div className="relative h-52 w-full overflow-hidden rounded-t-2xl bg-slate-100">
              {/* A soft blurred copy fills the sides, so a small or narrow photo is shown whole instead of stretched. */}
              <Image src={item.image_url} alt="" fill sizes="64px" aria-hidden className="scale-125 object-cover opacity-70 blur-2xl" />
              <Image src={item.image_url} alt="" fill sizes="(max-width: 512px) 100vw, 512px" className="object-contain" priority />
            </div>
          ) : (
            <DishTile text={tileText} type={placeType} className="h-40 w-full !rounded-b-none rounded-t-2xl" iconClassName="h-24 w-24" />
          )}
          <button
            ref={closeRef} type="button" onClick={onClose} aria-label={t("close")}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-2xl text-slate-700 shadow-md"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <h2 id="item-sheet-title" className="text-xl font-extrabold leading-tight">{name}</h2>
            <p className="mt-1 inline-block rounded-full bg-blue-50 px-3 py-0.5 text-base font-bold text-brand-blue">{formatNPR(line.price)}</p>
            {item.description && <p className="mt-2 text-slate-700">{item.description}</p>}
          </div>

          {!item.is_available ? (
            <p className="rounded-xl bg-slate-100 p-3 font-semibold text-slate-700">{c("soldOut")}</p>
          ) : (
            <>
              {groups.map((g, gi) => (
                <fieldset key={gi} className="space-y-2">
                  <legend className="mb-1 font-bold">
                    {pick(g.name, g.name_ne, locale)}{" "}
                    <span className="text-sm font-normal text-slate-600">
                      · {g.required ? t("required") : t("optional")} · {g.multi ? t("chooseAny") : t("chooseOne")}
                    </span>
                  </legend>
                  {g.choices.map((ch, ci) => {
                    const on = picked[gi].includes(ci);
                    return (
                      <label key={ci} className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 ${on ? "border-brand-blue bg-blue-50" : "border-slate-300"}`}>
                        <input
                          type={g.multi ? "checkbox" : "radio"} name={`opt-${gi}`} checked={on} onChange={() => toggle(gi, ci)}
                          className="h-5 w-5 accent-[#2E5A9C]"
                        />
                        <span className="flex-1 font-semibold">{pick(ch.name, ch.name_ne, locale)}</span>
                        {ch.price !== 0 && <span className="text-sm font-semibold text-slate-700">{ch.price > 0 ? "+" : "−"}{formatNPR(Math.abs(ch.price))}</span>}
                      </label>
                    );
                  })}
                </fieldset>
              ))}

              <label className="block space-y-1">
                <span className="font-bold">{t("note")} <span className="text-sm font-normal text-slate-600">· {c("optional")}</span></span>
                <input
                  value={note} onChange={(e) => setNote(e.target.value.slice(0, 120))} placeholder={t("notePlaceholder")}
                  className="w-full min-h-[48px] rounded-lg border border-slate-300 px-3 text-base focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                />
              </label>

              {error && <p role="alert" className="text-sm font-semibold text-brand-red">{error}</p>}

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-full bg-brand-blue shadow-md shadow-brand-blue/30">
                  <button type="button" className={step} aria-label={t("less")} disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                  <span className="min-w-[2rem] text-center text-lg font-bold text-white" aria-live="polite">{qty}</span>
                  <button type="button" className={step} aria-label={t("more")} disabled={qty >= 20} onClick={() => setQty((q) => Math.min(20, q + 1))}>+</button>
                </div>
                <button
                  type="button" onClick={submit}
                  className="min-h-[52px] flex-1 rounded-xl bg-brand-red px-3 text-base font-bold leading-tight text-white shadow-lg shadow-brand-red/30 transition active:scale-95"
                >
                  {t("add")} · {formatNPR(total)}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
