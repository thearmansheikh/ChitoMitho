"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { pick } from "@/lib/names";
import { EMPTY_DETAILS, PHONE_RE, normalizePhone, type Details, type Payment } from "@/lib/details";
import { nowMinutesNPT, parseTimeToMinutes } from "@/lib/format";
import type { Area, AreaGroup } from "@/types/db";
import LocationButton, { type Coords } from "./LocationButton";
import { useToles } from "@/lib/toles";

const GROUPS: AreaGroup[] = ["dharan", "itahari", "biratnagar", "nearby"];
const input =
  "w-full min-h-[48px] rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30";

type Errors = Partial<Record<"name" | "phone" | "phone2" | "area" | "areaOther" | "tole" | "landmark" | "time", string>>;

export interface SheetExtra {
  location: Coords | null;
  /** null means "as soon as possible". */
  deliverAt: { day: "today" | "tomorrow"; time: string } | null;
}

/** A customer can pick a time at least this long from now, so the team has time to prepare. */
const LEAD_MINUTES = 30;

export default function DetailsSheet({ open, onClose, onConfirm, areas, initial, busy, openTime, closeTime, allowSchedule, preview }: {
  open: boolean;
  onClose: () => void;
  onConfirm: (d: Details, note: string, extra: SheetExtra) => void;
  openTime: string;
  closeTime: string;
  /** Hide the delivery-time choice (gift orders already pick their own date and time). */
  allowSchedule: boolean;
  areas: Area[];
  initial: Details | null;
  busy: boolean;
  /** Builds the exact WhatsApp message so the customer can read it before it opens. */
  preview?: (d: Details, note: string, extra: SheetExtra) => string;
}) {
  const t = useTranslations("order");
  const locale = useLocale();
  const [d, setD] = useState<Details>(EMPTY_DETAILS);
  const [note, setNote] = useState("");
  const [loc, setLoc] = useState<Coords | null>(null); // never saved; asked fresh for every order
  const [review, setReview] = useState<{ d: Details; note: string; extra: SheetExtra; text: string } | null>(null);
  const [when, setWhen] = useState<"asap" | "later">("asap");
  const [day, setDay] = useState<"today" | "tomorrow">("today");
  const [time, setTime] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const toles = useToles(open);
  /** A message disappears as soon as the customer starts fixing that field. */
  const fix = (...keys: (keyof Errors)[]) => setErrors((e) => (keys.some((k) => e[k]) ? Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k as keyof Errors))) : e));
  const firstRef = useRef<HTMLInputElement>(null);

  // Prefill from saved details each time the sheet opens.
  useEffect(() => {
    if (!open) return;
    setD(initial ?? EMPTY_DETAILS);
    setErrors({});
    setLoc(null);
    setReview(null);
    setWhen("asap");
    setTime("");
    const id = setTimeout(() => firstRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const openMin = parseTimeToMinutes(openTime);
  const closeMin = parseTimeToMinutes(closeTime);
  const openLabel = openTime.slice(0, 5);
  const closeLabel = closeTime.slice(0, 5);
  // "Today" only makes sense while there is still room before closing.
  const todayPossible = nowMinutesNPT() + LEAD_MINUTES < closeMin;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const phone = normalizePhone(d.phone);
    const err: Errors = {};
    let deliverAt: SheetExtra["deliverAt"] = null;
    if (!d.name.trim()) err.name = t("required");
    if (!PHONE_RE.test(phone)) err.phone = t("phoneInvalid");
    if (!d.areaId) err.area = t("areaRequired");
    if (d.areaId === "other" && !d.areaOther.trim()) err.areaOther = t("required");
    if (allowSchedule && when === "later") {
      const m = time ? parseTimeToMinutes(time) : NaN;
      if (Number.isNaN(m)) err.time = t("required");
      else if (m < openMin || m >= closeMin) err.time = t("timeOutside", { open: openLabel, close: closeLabel });
      else if (day === "today" && m < nowMinutesNPT() + LEAD_MINUTES) err.time = t("timeTooSoon");
      else deliverAt = { day, time };
    }
    // The rider needs somewhere to go: a tole or street, or a landmark (ideally both).
    if (!d.tole.trim() && !d.landmark.trim()) err.tole = t("addressRequired");
    const phone2 = normalizePhone(d.phone2);
    if (d.phone2.trim() && !PHONE_RE.test(phone2)) err.phone2 = t("phoneInvalid");
    setErrors(err);
    if (Object.keys(err).length) return;
    const clean = {
      ...d, name: d.name.trim(), phone, phone2: d.phone2.trim() ? phone2 : "", areaOther: d.areaOther.trim(),
      tole: d.tole.trim(), house: d.house.trim(), landmark: d.landmark.trim(),
    };
    const extra: SheetExtra = { location: loc, deliverAt };
    // Show the customer exactly what will be sent before WhatsApp opens.
    if (preview) return setReview({ d: clean, note, extra, text: preview(clean, note, extra) });
    onConfirm(clean, note, extra);
  }

  const errText = (m?: string) => (m ? <span role="alert" className="block text-sm text-brand-red">{m}</span> : null);

  if (review) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
        <div
          role="dialog" aria-modal="true" aria-labelledby="review-title" onClick={(e) => e.stopPropagation()}
          className="max-h-[92vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="review-title" className="text-xl font-extrabold text-brand-blue">{t("reviewTitle")}</h2>
              <p className="text-sm text-slate-600">{t("reviewHelp")}</p>
            </div>
            <button type="button" onClick={onClose} aria-label={t("close")} className="flex h-11 w-11 flex-none items-center justify-center rounded-lg text-2xl text-slate-500">×</button>
          </div>
          {/* Looks like the WhatsApp message it will become. */}
          <pre tabIndex={0} className="max-h-[46vh] overflow-auto whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm bg-[#DCF8C6] p-4 font-sans text-sm leading-relaxed text-slate-900 shadow-sm">
            {review.text}
          </pre>
          <button type="button" disabled={busy} onClick={() => onConfirm(review.d, review.note, review.extra)}
            className="min-h-[56px] w-full rounded-xl bg-green-700 text-lg font-bold text-white disabled:opacity-60">
            {busy ? t("opening") : `💬 ${t("reviewSend")}`}
          </button>
          <button type="button" onClick={() => setReview(null)} className="min-h-[48px] w-full rounded-lg border border-slate-300 font-semibold">
            {t("reviewEdit")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <form
        role="dialog" aria-modal="true" aria-labelledby="details-title" noValidate
        onSubmit={submit} onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="details-title" className="text-xl font-extrabold text-brand-blue">{t("title")}</h2>
            <p className="text-sm text-slate-600">{t("intro")}</p>
            <p className="mt-1 text-xs text-slate-500">
              {t("privacyNote")}{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-blue underline">{t("privacyLink")}</a>
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("close")} className="flex h-11 w-11 flex-none items-center justify-center rounded-lg text-2xl text-slate-500">×</button>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("name")}</span>
          <input ref={firstRef} className={input} autoComplete="name" value={d.name} onChange={(e) => { setD({ ...d, name: e.target.value }); fix("name"); }} aria-invalid={!!errors.name} />
          {errText(errors.name)}
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("phone")}</span>
          <input className={input} type="tel" inputMode="numeric" autoComplete="tel" placeholder="98XXXXXXXX" value={d.phone} onChange={(e) => { setD({ ...d, phone: e.target.value }); fix("phone"); }} aria-invalid={!!errors.phone} />
          <span className="block text-xs text-slate-500">{t("phoneHelp")}</span>
          {errText(errors.phone)}
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("phone2")}</span>
          <input className={input} type="tel" inputMode="numeric" autoComplete="off" placeholder="98XXXXXXXX" value={d.phone2} onChange={(e) => { setD({ ...d, phone2: e.target.value }); fix("phone2"); }} aria-invalid={!!errors.phone2} />
          <span className="block text-xs text-slate-500">{t("phone2Help")}</span>
          {errText(errors.phone2)}
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("area")}</span>
          <select className={input} value={d.areaId} onChange={(e) => { setD({ ...d, areaId: e.target.value }); fix("area", "areaOther"); }} aria-invalid={!!errors.area}>
            <option value="">{t("areaChoose")}</option>
            {GROUPS.map((g) => {
              const list = areas.filter((a) => a.area_group === g);
              if (!list.length) return null;
              return (
                <optgroup key={g} label={t(`groups.${g}`)}>
                  {list.map((a) => <option key={a.id} value={a.id}>{pick(a.name, a.name_ne, locale)}</option>)}
                </optgroup>
              );
            })}
            <option value="other">{t("areaOther")}</option>
          </select>
          {errText(errors.area)}
        </label>

        {d.areaId === "other" && (
          <label className="block space-y-1">
            <span className="text-sm font-semibold">{t("areaOtherLabel")}</span>
            <input className={input} value={d.areaOther} onChange={(e) => { setD({ ...d, areaOther: e.target.value }); fix("areaOther"); }} aria-invalid={!!errors.areaOther} />
            {errText(errors.areaOther)}
          </label>
        )}

        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("tole")}</span>
          <input
            className={input} list="tole-suggestions" autoComplete="off" placeholder={t("tolePlaceholder")} value={d.tole}
            onChange={(e) => { setD({ ...d, tole: e.target.value }); fix("tole"); }} aria-invalid={!!errors.tole}
          />
          <datalist id="tole-suggestions">
            {toles
              .filter((x) => x.area_id === null || x.area_id === d.areaId)
              .map((x) => <option key={x.id} value={pick(x.name, x.name_ne, locale)} />)}
          </datalist>
          <span className="block text-xs text-slate-500">{t("toleHelp")}</span>
          {errText(errors.tole)}
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("house")}</span>
          <input className={input} autoComplete="off" value={d.house} onChange={(e) => setD({ ...d, house: e.target.value })} />
          <span className="block text-xs text-slate-500">{t("houseHelp")}</span>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("landmark")}</span>
          <input className={input} autoComplete="off" value={d.landmark} onChange={(e) => { setD({ ...d, landmark: e.target.value }); fix("tole"); }} aria-invalid={!!errors.landmark} />
          <span className="block text-xs text-slate-500">{t("landmarkHelp")}</span>
        </label>

        <LocationButton value={loc} onChange={setLoc} />

        {allowSchedule && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">{t("whenTitle")}</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["asap", "later"] as const).map((w) => (
                <label key={w} className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-lg border px-2 text-center font-semibold ${when === w ? "border-brand-blue bg-blue-50 text-brand-blue" : "border-slate-300"}`}>
                  <input
                    type="radio" name="when" className="sr-only" checked={when === w}
                    onChange={() => { setWhen(w); fix("time"); if (w === "later") setDay(todayPossible ? "today" : "tomorrow"); }}
                  />
                  {t(w)}
                </label>
              ))}
            </div>
            {when === "later" && (
              <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <span className="text-sm font-semibold">{t("day")}</span>
                    <select className={input} value={day} onChange={(e) => { setDay(e.target.value as "today" | "tomorrow"); fix("time"); }}>
                      <option value="today" disabled={!todayPossible}>{t("today")}</option>
                      <option value="tomorrow">{t("tomorrow")}</option>
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-semibold">{t("timeLabel")}</span>
                    <input className={input} type="time" min={openLabel} max={closeLabel} value={time} onChange={(e) => { setTime(e.target.value); fix("time"); }} aria-invalid={!!errors.time} />
                  </label>
                </div>
                <p className="text-xs text-slate-600">{t("timeRange", { open: openLabel, close: closeLabel })}</p>
                {errText(errors.time)}
              </div>
            )}
          </fieldset>
        )}

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">{t("payment")}</legend>
          {(["cod", "qr"] as Payment[]).map((p) => (
            <label key={p} className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border p-3 ${d.payment === p ? "border-brand-blue bg-blue-50" : "border-slate-300"}`}>
              <input type="radio" name="payment" className="h-5 w-5" checked={d.payment === p} onChange={() => setD({ ...d, payment: p })} />
              {t(p)}
            </label>
          ))}
        </fieldset>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("note")}</span>
          <textarea className={`${input} min-h-[72px]`} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        <button disabled={busy} className="min-h-[56px] w-full rounded-xl bg-green-700 text-lg font-bold text-white disabled:opacity-60">
          {busy ? t("opening") : preview ? t("review") : `💬 ${t("continue")}`}
        </button>
        <button type="button" onClick={onClose} className="min-h-[44px] w-full text-sm font-semibold text-slate-600">{t("cancel")}</button>
      </form>
    </div>
  );
}
