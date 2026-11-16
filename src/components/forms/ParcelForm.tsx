"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PHONE_RE, normalizePhone } from "@/lib/details";
import { parcelMessage, type ParcelOrder } from "@/lib/whatsapp";
import type { Area } from "@/types/db";
import SendOrder, { type OrderConfig } from "./SendOrder";

const input =
  "w-full min-h-[48px] rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30";
const SIZES = ["small", "medium", "large"] as const;

export default function ParcelForm({ config, areas }: { config: OrderConfig; areas: Area[] }) {
  const t = useTranslations("parcel");
  const o = useTranslations("order");
  const [f, setF] = useState({ pickup: "", drop: "", item: "", size: "small" as ParcelOrder["size"], receiverName: "", receiverPhone: "" });
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  function validate(): string | null {
    if (!f.pickup.trim() || !f.drop.trim() || !f.item.trim() || !f.receiverName.trim()) return o("required");
    if (!PHONE_RE.test(normalizePhone(f.receiverPhone))) return o("phoneInvalid");
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-blue">{t("title")}</h1>
        <p className="text-slate-600">{t("intro")}</p>
      </div>

      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("pickup")}</span>
          <input className={input} value={f.pickup} onChange={(e) => set("pickup", e.target.value)} />
          <span className="block text-xs text-slate-500">{t("pickupHelp")}</span>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("drop")}</span>
          <input className={input} value={f.drop} onChange={(e) => set("drop", e.target.value)} />
          <span className="block text-xs text-slate-500">{t("dropHelp")}</span>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("item")}</span>
          <textarea className={`${input} min-h-[80px]`} value={f.item} onChange={(e) => set("item", e.target.value)} />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">{t("size")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {SIZES.map((s) => (
              <label key={s} className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-lg border font-semibold ${f.size === s ? "border-brand-blue bg-blue-50 text-brand-blue" : "border-slate-300"}`}>
                <input type="radio" name="size" className="sr-only" checked={f.size === s} onChange={() => set("size", s)} />
                {t(s)}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("receiverName")}</span>
          <input className={input} value={f.receiverName} onChange={(e) => set("receiverName", e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("receiverPhone")}</span>
          <input className={input} type="tel" inputMode="numeric" placeholder="98XXXXXXXX" value={f.receiverPhone} onChange={(e) => set("receiverPhone", e.target.value)} />
        </label>
      </div>

      <SendOrder
        service="parcel" placeId={null} itemsTotal={null} config={config} areas={areas}
        validate={validate}
        build={(customer, lang) =>
          parcelMessage(lang, {
            pickup: f.pickup.trim(), drop: f.drop.trim(), item: f.item.trim(), size: f.size,
            receiverName: f.receiverName.trim(), receiverPhone: normalizePhone(f.receiverPhone),
          }, customer)
        }
      />
    </div>
  );
}
