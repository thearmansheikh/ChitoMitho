"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PHONE_RE, normalizePhone } from "@/lib/details";
import PageHeader from "@/components/ui/PageHeader";
import FormField from "@/components/ui/FormField";
import { partnerMessage, riderMessage, buildWhatsAppUrl, type BusinessType, type Lang, type Vehicle } from "@/lib/whatsapp";
import { openWhatsApp } from "@/lib/openWhatsApp";

const input =
  "w-full min-h-[48px] rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30";
const TYPES: BusinessType[] = ["cafe", "grocery", "liquor", "gifts", "other"];
const VEHICLES: Vehicle[] = ["bike", "scooter", "bicycle", "other"];

type Mode = "business" | "rider";
type Errors = Partial<Record<"business" | "typeOther" | "contactName" | "phone" | "area" | "consent" | "name", string>>;

/** Sends a partner or rider request to the team's WhatsApp. Nothing is stored on the website. */
export default function PartnerForm({ whatsapp }: { whatsapp: string }) {
  const t = useTranslations("partner");
  const o = useTranslations("order");
  const c = useTranslations("common");
  const lang = useLocale() as Lang;

  const [mode, setMode] = useState<Mode>("business");
  const [errors, setErrors] = useState<Errors>({});
  const [sentUrl, setSentUrl] = useState<string | null>(null);

  const [b, setB] = useState({ business: "", type: "cafe" as BusinessType, typeOther: "", contactName: "", phone: "", area: "", offer: "", consent: false });
  const [r, setR] = useState({ name: "", phone: "", area: "", hasVehicle: true, vehicle: "bike" as Vehicle, hasLicense: true, availability: "" });

  const clear = (k: keyof Errors) => setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));

  function open(url: string) {
    openWhatsApp(url);
    setSentUrl(url);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const err: Errors = {};
    if (mode === "business") {
      if (!b.business.trim()) err.business = o("required");
      if (b.type === "other" && !b.typeOther.trim()) err.typeOther = o("required");
      if (!b.contactName.trim()) err.contactName = o("required");
      if (!PHONE_RE.test(normalizePhone(b.phone))) err.phone = o("phoneInvalid");
      if (!b.area.trim()) err.area = o("required");
      if (!b.consent) err.consent = t("consentRequired");
      setErrors(err);
      if (Object.keys(err).length) return;
      open(buildWhatsAppUrl(whatsapp, partnerMessage(lang, {
        business: b.business.trim(), type: b.type, typeOther: b.typeOther.trim(), contactName: b.contactName.trim(),
        phone: normalizePhone(b.phone), area: b.area.trim(), offer: b.offer,
      })));
    } else {
      if (!r.name.trim()) err.name = o("required");
      if (!PHONE_RE.test(normalizePhone(r.phone))) err.phone = o("phoneInvalid");
      if (!r.area.trim()) err.area = o("required");
      setErrors(err);
      if (Object.keys(err).length) return;
      open(buildWhatsAppUrl(whatsapp, riderMessage(lang, {
        name: r.name.trim(), phone: normalizePhone(r.phone), area: r.area.trim(),
        hasVehicle: r.hasVehicle, vehicle: r.vehicle, hasLicense: r.hasLicense, availability: r.availability,
      })));
    }
  }

  if (sentUrl) {
    return (
      <div role="status" className="space-y-4 py-6 text-center">
        <p className="text-6xl" aria-hidden>✅</p>
        <h2 className="text-2xl font-extrabold text-brand-blue">{t("sentTitle")}</h2>
        <p className="mx-auto max-w-sm text-slate-700">{t("sentBody")}</p>
        <a href={sentUrl} target="_blank" rel="noopener noreferrer" className="mx-auto flex min-h-[56px] max-w-sm items-center justify-center rounded-xl bg-green-700 text-lg font-bold text-white">
          💬 {o("sentAgain")}
        </a>
        <button type="button" onClick={() => setSentUrl(null)} className="min-h-[44px] text-sm font-semibold text-slate-600">{t("sendAnother")}</button>
      </div>
    );
  }

  const tab = (m: Mode) =>
    `min-h-[48px] flex-1 rounded-lg font-bold ${mode === m ? "bg-brand-blue text-white" : "bg-slate-100 text-brand-blue"}`;
  const yesNo = (name: string, value: boolean, onChange: (v: boolean) => void) => (
    <div className="grid grid-cols-2 gap-2">
      {[true, false].map((v) => (
        <label key={String(v)} className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-lg border px-2 font-semibold ${value === v ? "border-brand-blue bg-blue-50 text-brand-blue" : "border-slate-300"}`}>
          <input type="radio" name={name} className="sr-only" checked={value === v} onChange={() => onChange(v)} />
          {v ? t("yes") : t("no")}
        </label>
      ))}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <PageHeader icon="🤝" tone="amber" title={t("title")} subtitle={t("intro")} />
      <p className="text-xs text-slate-600">{c("requiredNote")}</p>

      <div role="tablist" aria-label={t("title")} className="flex gap-2">
        <button type="button" role="tab" aria-selected={mode === "business"} className={tab("business")} onClick={() => { setMode("business"); setErrors({}); }}>🏪 {t("tabBusiness")}</button>
        <button type="button" role="tab" aria-selected={mode === "rider"} className={tab("rider")} onClick={() => { setMode("rider"); setErrors({}); }}>🏍️ {t("tabRider")}</button>
      </div>

      {mode === "business" ? (
        <div className="space-y-3">
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{t("businessIntro")}</p>
          <FormField label={t("business")} required error={errors.business}>
            <input className={input} value={b.business} onChange={(e) => { setB({ ...b, business: e.target.value }); clear("business"); }} autoComplete="organization" aria-invalid={!!errors.business} />
          </FormField>
          <FormField label={t("type")} required>
            <select className={input} value={b.type} onChange={(e) => { setB({ ...b, type: e.target.value as BusinessType }); clear("typeOther"); }}>
              {TYPES.map((x) => <option key={x} value={x}>{t(`types.${x}`)}</option>)}
            </select>
          </FormField>
          {b.type === "other" && (
            <FormField label={t("typeOther")} required error={errors.typeOther}>
              <input className={input} value={b.typeOther} onChange={(e) => { setB({ ...b, typeOther: e.target.value }); clear("typeOther"); }} aria-invalid={!!errors.typeOther} />
            </FormField>
          )}
          <FormField label={t("contactName")} required error={errors.contactName}>
            <input className={input} value={b.contactName} onChange={(e) => { setB({ ...b, contactName: e.target.value }); clear("contactName"); }} autoComplete="name" aria-invalid={!!errors.contactName} />
          </FormField>
          <FormField label={t("phone")} required error={errors.phone}>
            <input className={input} type="tel" inputMode="numeric" placeholder="98XXXXXXXX" value={b.phone} onChange={(e) => { setB({ ...b, phone: e.target.value }); clear("phone"); }} autoComplete="tel" aria-invalid={!!errors.phone} />
          </FormField>
          <FormField label={t("area")} required help={t("areaHelp")} error={errors.area}>
            <input className={input} value={b.area} onChange={(e) => { setB({ ...b, area: e.target.value }); clear("area"); }} aria-invalid={!!errors.area} />
          </FormField>
          <FormField label={t("offer")}>
            <textarea className={`${input} min-h-[80px]`} value={b.offer} onChange={(e) => setB({ ...b, offer: e.target.value })} />
          </FormField>
          <div>
            <label className="flex min-h-[48px] cursor-pointer items-start gap-3 rounded-lg border border-slate-300 p-3">
              <input type="checkbox" className="mt-1 h-5 w-5 flex-none" checked={b.consent} onChange={(e) => { setB({ ...b, consent: e.target.checked }); clear("consent"); }} aria-invalid={!!errors.consent} />
              <span className="text-sm">{t("consent")}</span>
            </label>
            {errors.consent && <p role="alert" className="mt-1 text-sm text-brand-red">{errors.consent}</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{t("riderIntro")}</p>
          <FormField label={t("riderName")} required error={errors.name}>
            <input className={input} value={r.name} onChange={(e) => { setR({ ...r, name: e.target.value }); clear("name"); }} autoComplete="name" aria-invalid={!!errors.name} />
          </FormField>
          <FormField label={t("phone")} required error={errors.phone}>
            <input className={input} type="tel" inputMode="numeric" placeholder="98XXXXXXXX" value={r.phone} onChange={(e) => { setR({ ...r, phone: e.target.value }); clear("phone"); }} autoComplete="tel" aria-invalid={!!errors.phone} />
          </FormField>
          <FormField label={t("riderArea")} required error={errors.area}>
            <input className={input} value={r.area} onChange={(e) => { setR({ ...r, area: e.target.value }); clear("area"); }} aria-invalid={!!errors.area} />
          </FormField>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">{t("hasVehicle")}</legend>
            {yesNo("hasVehicle", r.hasVehicle, (v) => setR({ ...r, hasVehicle: v }))}
          </fieldset>
          {r.hasVehicle && (
            <FormField label={t("vehicle")}>
              <select className={input} value={r.vehicle} onChange={(e) => setR({ ...r, vehicle: e.target.value as Vehicle })}>
                {VEHICLES.map((x) => <option key={x} value={x}>{t(`vehicles.${x}`)}</option>)}
              </select>
            </FormField>
          )}
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">{t("license")}</legend>
            {yesNo("hasLicense", r.hasLicense, (v) => setR({ ...r, hasLicense: v }))}
          </fieldset>
          <FormField label={t("availability")} help={t("availabilityHelp")}>
            <input className={input} value={r.availability} onChange={(e) => setR({ ...r, availability: e.target.value })} />
          </FormField>
        </div>
      )}

      {Object.values(errors).some(Boolean) && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-brand-red">{o("checkFields")}</p>}

      <button className="min-h-[56px] w-full rounded-xl bg-green-700 text-lg font-bold text-white">💬 {t("send")}</button>
      <p className="text-center text-xs text-slate-500">{t("privacy")}</p>
    </form>
  );
}
