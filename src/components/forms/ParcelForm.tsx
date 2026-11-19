"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PHONE_RE, normalizePhone } from "@/lib/details";
import { parcelMessage, type ParcelOrder } from "@/lib/whatsapp";
import type { Area } from "@/types/db";
import PageHeader from "@/components/ui/PageHeader";
import ServiceIcon from "@/components/ui/ServiceIcon";
import FormField from "@/components/ui/FormField";
import LocationButton, { type Coords } from "./LocationButton";
import SendOrder, { type OrderConfig } from "./SendOrder";

const input =
  "w-full min-h-[48px] rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30";
const SIZES = ["small", "medium", "large"] as const;

type Field = "pickup" | "drop" | "item" | "receiverName" | "receiverPhone";

export default function ParcelForm({ config, areas }: { config: OrderConfig; areas: Area[] }) {
  const t = useTranslations("parcel");
  const o = useTranslations("order");
  const c = useTranslations("common");
  const [f, setF] = useState({ pickup: "", drop: "", item: "", size: "small" as ParcelOrder["size"], receiverName: "", receiverPhone: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  // Map pins stay in memory only and go into the WhatsApp message as links.
  const [pickupPin, setPickupPin] = useState<Coords | null>(null);
  const [dropPin, setDropPin] = useState<Coords | null>(null);
  const set = (k: keyof typeof f, v: string) => {
    setF((s) => ({ ...s, [k]: v }));
    if (k in errors) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  /** The sender's own name, phone and address come next, in the details sheet (filled in from what this phone saved). */
  function validate(): string | null {
    const err: Partial<Record<Field, string>> = {};
    if (!f.pickup.trim()) err.pickup = o("required");
    if (!f.drop.trim()) err.drop = o("required");
    if (!f.item.trim()) err.item = o("required");
    if (!f.receiverName.trim()) err.receiverName = o("required");
    if (!PHONE_RE.test(normalizePhone(f.receiverPhone))) err.receiverPhone = o("phoneInvalid");
    setErrors(err);
    return Object.keys(err).length ? "" : null;
  }

  return (
    <div className="space-y-4">
      <PageHeader icon={<ServiceIcon name="parcel" className="h-9 w-9" />} tone="blue" title={t("title")} subtitle={t("intro")} />
      <p className="text-xs text-slate-600">{c("requiredNote")}</p>

      <div className="space-y-4">
        <div className="space-y-2 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200/70">
          <FormField label={t("pickup")} required help={t("pickupHelp")} error={errors.pickup}>
            <input className={input} value={f.pickup} onChange={(e) => set("pickup", e.target.value)} aria-invalid={!!errors.pickup} />
          </FormField>
          <LocationButton value={pickupPin} onChange={setPickupPin} buttonLabel={t("pinPickup")} helpText={t("pinHelp")} />
        </div>

        <div className="space-y-2 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200/70">
          <FormField label={t("drop")} required help={t("dropHelp")} error={errors.drop}>
            <input className={input} value={f.drop} onChange={(e) => set("drop", e.target.value)} aria-invalid={!!errors.drop} />
          </FormField>
          <LocationButton value={dropPin} onChange={setDropPin} buttonLabel={t("pinDrop")} helpText={t("pinHelp")} />
        </div>

        <FormField label={t("item")} required error={errors.item}>
          <textarea className={`${input} min-h-[80px]`} value={f.item} onChange={(e) => set("item", e.target.value)} aria-invalid={!!errors.item} />
        </FormField>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">{t("size")}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {SIZES.map((s) => (
              <label key={s} className={`flex min-h-[48px] cursor-pointer flex-col justify-center rounded-xl border p-3 transition ${f.size === s ? "border-brand-blue bg-blue-50" : "border-slate-300 bg-white"}`}>
                <input type="radio" name="size" className="sr-only" checked={f.size === s} onChange={() => set("size", s)} />
                <span className={`font-bold ${f.size === s ? "text-brand-blue" : ""}`}>{t(s)}</span>{" "}
                <span className="text-xs text-slate-600">{t(`${s}Hint`)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={t("receiverName")} required error={errors.receiverName}>
            <input className={input} value={f.receiverName} onChange={(e) => set("receiverName", e.target.value)} aria-invalid={!!errors.receiverName} />
          </FormField>
          <FormField label={t("receiverPhone")} required error={errors.receiverPhone}>
            <input className={input} type="tel" inputMode="numeric" placeholder="98XXXXXXXX" value={f.receiverPhone} onChange={(e) => set("receiverPhone", e.target.value)} aria-invalid={!!errors.receiverPhone} />
          </FormField>
        </div>

        <div className="rounded-2xl bg-amber-50 p-4 text-sm ring-1 ring-amber-100">
          <p className="font-bold">{t("cannotTitle")}</p>{" "}
          <p className="mt-0.5 text-slate-700">{t("cannotBody")}</p>
        </div>
      </div>

      {Object.values(errors).some(Boolean) && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-brand-red">{o("checkFields")}</p>}

      <SendOrder
        service="parcel" placeId={null} itemsTotal={null} config={config} areas={areas}
        validate={validate} whenTitle={o("whenPickup")}
        build={(customer, lang) =>
          parcelMessage(lang, {
            pickup: f.pickup.trim(), pickupPin, drop: f.drop.trim(), dropPin, item: f.item.trim(), size: f.size,
            receiverName: f.receiverName.trim(), receiverPhone: normalizePhone(f.receiverPhone),
          }, customer)
        }
      />
    </div>
  );
}
