"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PHONE_RE, normalizePhone } from "@/lib/details";
import PageHeader from "@/components/ui/PageHeader";
import { partnerMessage, riderMessage, buildWhatsAppUrl, type BusinessType, type Lang, type Vehicle } from "@/lib/whatsapp";
import { openWhatsApp } from "@/lib/openWhatsApp";

const input =
  "w-full min-h-[48px] rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30";
const TYPES: BusinessType[] = ["cafe", "grocery", "liquor", "gifts", "other"];
const VEHICLES: Vehicle[] = ["bike", "scooter", "bicycle", "other"];

type Mode = "business" | "rider";

/** Sends a partner or rider request to the team's WhatsApp. Nothing is stored on the website. */
export default function PartnerForm({ whatsapp }: { whatsapp: string }) {
  const t = useTranslations("partner");
  const o = useTranslations("order");
  const lang = useLocale() as Lang;

  const [mode, setMode] = useState<Mode>("business");
  const [error, setError] = useState<string | null>(null);
  const [sentUrl, setSentUrl] = useState<string | null>(null);

  const [b, setB] = useState({ business: "", type: "cafe" as BusinessType, contactName: "", phone: "", area: "", offer: "", consent: false });
  const [r, setR] = useState({ name: "", phone: "", area: "", vehicle: "bike" as Vehicle, hasLicense: true, availability: "" });

  function open(url: string) {
    openWhatsApp(url);
    setSentUrl(url);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "business") {
      if (!b.business.trim() || !b.contactName.trim() || !b.area.trim()) return setError(o("required"));
      if (!PHONE_RE.test(normalizePhone(b.phone))) return setError(o("phoneInvalid"));
      if (!b.consent) return setError(t("consentRequired"));
      open(buildWhatsAppUrl(whatsapp, partnerMessage(lang, {
        business: b.business.trim(), type: b.type, contactName: b.contactName.trim(),
        phone: normalizePhone(b.phone), area: b.area.trim(), offer: b.offer,
      })));
    } else {
      if (!r.name.trim() || !r.area.trim()) return setError(o("required"));
      if (!PHONE_RE.test(normalizePhone(r.phone))) return setError(o("phoneInvalid"));
      open(buildWhatsAppUrl(whatsapp, riderMessage(lang, {
        name: r.name.trim(), phone: normalizePhone(r.phone), area: r.area.trim(),
        vehicle: r.vehicle, hasLicense: r.hasLicense, availability: r.availability,
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

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <PageHeader icon="🤝" tone="amber" title={t("title")} subtitle={t("intro")} />

      <div role="tablist" aria-label={t("title")} className="flex gap-2">
        <button type="button" role="tab" aria-selected={mode === "business"} className={tab("business")} onClick={() => { setMode("business"); setError(null); }}>🏪 {t("tabBusiness")}</button>
        <button type="button" role="tab" aria-selected={mode === "rider"} className={tab("rider")} onClick={() => { setMode("rider"); setError(null); }}>🏍️ {t("tabRider")}</button>
      </div>

      {mode === "business" ? (
        <div className="space-y-3">
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{t("businessIntro")}</p>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t("business")}</span>
            <input className={input} value={b.business} onChange={(e) => setB({ ...b, business: e.target.value })} autoComplete="organization" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t("type")}</span>
            <select className={input} value={b.type} onChange={(e) => setB({ ...b, type: e.target.value as BusinessType })}>
              {TYPES.map((x) => <option key={x} value={x}>{t(`types.${x}`)}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t("contactName")}</span>
            <input className={input} value={b.contactName} onChange={(e) => setB({ ...b, contactName: e.target.value })} autoComplete="name" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t("phone")}</span>
            <input className={input} type="tel" inputMode="numeric" placeholder="98XXXXXXXX" value={b.phone} onChange={(e) => setB({ ...b, phone: e.target.value })} autoComplete="tel" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t("area")}</span>
            <input className={input} value={b.area} onChange={(e) => setB({ ...b, area: e.target.value })} />
            <span className="block text-xs text-slate-500">{t("areaHelp")}</span>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t("offer")}</span>
            <textarea className={`${input} min-h-[80px]`} value={b.offer} onChange={(e) => setB({ ...b, offer: e.target.value })} />
          </label>
          <label className="flex min-h-[48px] cursor-pointer items-start gap-3 rounded-lg border border-slate-300 p-3">
            <input type="checkbox" className="mt-1 h-5 w-5 flex-none" checked={b.consent} onChange={(e) => setB({ ...b, consent: e.target.checked })} />
            <span className="text-sm">{t("consent")}</span>
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{t("riderIntro")}</p>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t("riderName")}</span>
            <input className={input} value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} autoComplete="name" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t("phone")}</span>
            <input className={input} type="tel" inputMode="numeric" placeholder="98XXXXXXXX" value={r.phone} onChange={(e) => setR({ ...r, phone: e.target.value })} autoComplete="tel" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t("area")}</span>
            <input className={input} value={r.area} onChange={(e) => setR({ ...r, area: e.target.value })} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t("vehicle")}</span>
            <select className={input} value={r.vehicle} onChange={(e) => setR({ ...r, vehicle: e.target.value as Vehicle })}>
              {VEHICLES.map((x) => <option key={x} value={x}>{t(`vehicles.${x}`)}</option>)}
            </select>
          </label>
          <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border border-slate-300 p-3">
            <input type="checkbox" className="h-5 w-5" checked={r.hasLicense} onChange={(e) => setR({ ...r, hasLicense: e.target.checked })} />
            <span className="text-sm">{t("license")}</span>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t("availability")}</span>
            <input className={input} value={r.availability} onChange={(e) => setR({ ...r, availability: e.target.value })} placeholder={t("availabilityHelp")} />
          </label>
        </div>
      )}

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-brand-red">{error}</p>}

      <button className="min-h-[56px] w-full rounded-xl bg-green-700 text-lg font-bold text-white">💬 {t("send")}</button>
      <p className="text-center text-xs text-slate-500">{t("privacy")}</p>
    </form>
  );
}
