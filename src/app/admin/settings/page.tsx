"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { btnPrimary, Card, Field, inputCls, Notice } from "@/components/admin/ui";
import { DAY_NAMES, validWeekHours, type DayHours } from "@/lib/hours";
import type { Settings } from "@/types/db";

// Shown Monday first; the stored week starts on Sunday (index 0).
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

type Form = {
  whatsapp_number: string;
  phones: string;
  open_time: string;
  close_time: string;
  delivery_from: string;
  places_without_menu: "badge" | "hide";
  liquor_enabled: boolean;
  different_days: boolean;
  week: DayHours[];
  orders_paused: boolean;
  pause_message: string;
  announcement: string;
  liquor_age_text: string;
};

function weekState(s: Settings | null): { different_days: boolean; week: DayHours[] } {
  const stored = validWeekHours(s?.weekday_hours);
  const open = (s?.open_time ?? "10:00").slice(0, 5), close = (s?.close_time ?? "22:00").slice(0, 5);
  return { different_days: !!stored, week: stored ?? Array.from({ length: 7 }, () => ({ open, close, closed: false })) };
}

export default function SettingsPage() {
  const [f, setF] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    createClient().from("settings").select("*").eq("id", 1).maybeSingle().then(({ data, error }) => {
      if (error) return setError(error.message);
      const s = data as Settings | null;
      setF({
        whatsapp_number: s?.whatsapp_number ?? "",
        phones: (s?.phone_numbers ?? []).join(", "),
        open_time: (s?.open_time ?? "10:00").slice(0, 5),
        close_time: (s?.close_time ?? "22:00").slice(0, 5),
        delivery_from: s?.delivery_from_npr == null ? "" : String(Number(s.delivery_from_npr)),
        places_without_menu: s?.places_without_menu === "hide" ? "hide" : "badge",
        liquor_enabled: s?.liquor_enabled === true,
        ...weekState(s),
        orders_paused: s?.orders_paused ?? false,
        pause_message: s?.pause_message ?? "",
        announcement: s?.announcement ?? "",
        liquor_age_text: s?.liquor_age_text ?? "",
      });
    });
  }, []);

  if (!f) return <><Notice error={error} /><p className="text-slate-500">Loading…</p></>;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF({ ...f, [k]: v });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f) return;
    setError(null); setOk(null);
    const wa = f.whatsapp_number.replace(/\D/g, "");
    if (!/^9[78]\d{8}$/.test(wa)) return setError("WhatsApp number must be a 10-digit Nepal mobile number (97/98…).");
    const from = f.delivery_from.trim();
    const fromNum = from === "" ? null : Number(from);
    if (fromNum !== null && (!Number.isFinite(fromNum) || fromNum < 0)) return setError("Enter the delivery starting amount as a number, or leave it empty.");
    setBusy(true);
    const { error } = await createClient().from("settings").upsert({
      id: 1,
      whatsapp_number: wa,
      phone_numbers: f.phones.split(",").map((p) => p.trim()).filter(Boolean),
      open_time: f.open_time,
      close_time: f.close_time,
      delivery_from_npr: fromNum,
      places_without_menu: f.places_without_menu,
      liquor_enabled: f.liquor_enabled,
      weekday_hours: f.different_days ? f.week : null,
      orders_paused: f.orders_paused,
      pause_message: f.pause_message.trim() || null,
      announcement: f.announcement.trim() || null,
      liquor_age_text: f.liquor_age_text.trim() || null,
    });
    setBusy(false);
    if (error) setError(/weekday_hours/.test(error.message) ? "The weekday hours column is missing. Run supabase/migrations/0008_weekday_hours.sql in the Supabase SQL Editor first." : /places_without_menu/.test(error.message) ? "The places setting is missing. Run supabase/migrations/0018_partner_places.sql in the Supabase SQL Editor first." : /liquor_enabled/.test(error.message) ? "The liquor switch is missing. Run supabase/migrations/0019_liquor_switch_and_starter_categories.sql in the Supabase SQL Editor first." : /delivery_from_npr/.test(error.message) ? "The delivery amount column is missing. Run supabase/migrations/0012_delivery_from.sql in the Supabase SQL Editor first." : error.message); else setOk("Settings saved. The site updates within a minute.");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-blue">Settings</h1>
      <Notice error={error} ok={ok} />
      <Card>
        <form onSubmit={save} className="space-y-3">
          <Field label="WhatsApp number that receives orders"><input className={inputCls} inputMode="numeric" required value={f.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} /></Field>
          <Field label="Phone numbers (comma separated)"><input className={inputCls} value={f.phones} onChange={(e) => set("phones", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Opens"><input type="time" className={inputCls} required value={f.open_time} onChange={(e) => set("open_time", e.target.value)} /></Field>
            <Field label="Closes"><input type="time" className={inputCls} required value={f.close_time} onChange={(e) => set("close_time", e.target.value)} /></Field>
          </div>
          <Field label="Delivery charge starts from (Rs.)">
            <input className={inputCls} inputMode="decimal" value={f.delivery_from} onChange={(e) => set("delivery_from", e.target.value)} placeholder="50" />
          </Field>
          <p className="-mt-2 text-xs text-slate-500">Shown to customers as “Delivery charge starts from Rs. 50”, with a note that the exact charge depends on the location and the order. Leave it empty to show only that the charge is not fixed. A fixed charge for one area (for example BPKIHS) is set in Areas.</p>
          <Field label="Places that have no menu yet">
            <select className={inputCls} value={f.places_without_menu} onChange={(e) => set("places_without_menu", e.target.value as "badge" | "hide")}>
              <option value="badge">Show them with a “Menu coming soon” badge and an order-on-WhatsApp button</option>
              <option value="hide">Hide them until they have a menu</option>
            </select>
          </Field>
          <label className="flex min-h-[44px] items-center gap-3 rounded-lg bg-slate-50 p-3 font-semibold">
            <input type="checkbox" className="h-5 w-5" checked={f.different_days} onChange={(e) => set("different_days", e.target.checked)} />
            Different hours on different days
          </label>
          {f.different_days && (
            <fieldset className="space-y-2 rounded-lg border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold text-slate-700">Hours for each day (these replace Opens and Closes above)</legend>
              {DISPLAY_ORDER.map((i) => {
                const d = f.week[i];
                const update = (patch: Partial<DayHours>) => set("week", f.week.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                return (
                  <div key={i} className="grid grid-cols-[5.5rem_1fr_1fr] items-center gap-2 sm:grid-cols-[7rem_1fr_1fr_auto]">
                    <span className="font-semibold">{DAY_NAMES[i]}</span>
                    <input type="time" aria-label={DAY_NAMES[i] + " opens"} className={inputCls} disabled={d.closed} required={!d.closed} value={d.open} onChange={(e) => update({ open: e.target.value })} />
                    <input type="time" aria-label={DAY_NAMES[i] + " closes"} className={inputCls} disabled={d.closed} required={!d.closed} value={d.close} onChange={(e) => update({ close: e.target.value })} />
                    <label className="col-span-3 flex min-h-[44px] items-center gap-2 text-sm sm:col-span-1">
                      <input type="checkbox" className="h-5 w-5" checked={!!d.closed} onChange={(e) => update({ closed: e.target.checked })} />
                      Closed all day
                    </label>
                  </div>
                );
              })}
            </fieldset>
          )}
          <label className="flex min-h-[44px] items-center gap-3 rounded-lg bg-slate-50 p-3 font-semibold">
            <input type="checkbox" className="h-5 w-5" checked={f.orders_paused} onChange={(e) => set("orders_paused", e.target.checked)} />
            Pause orders
          </label>
          <Field label="Pause message (rain, festival, busy…)"><input className={inputCls} value={f.pause_message} onChange={(e) => set("pause_message", e.target.value)} /></Field>
          <Field label="Top announcement banner"><input className={inputCls} value={f.announcement} onChange={(e) => set("announcement", e.target.value)} /></Field>
          <label className="flex min-h-[44px] items-center gap-3 rounded-lg bg-slate-50 p-3 font-semibold">
            <input type="checkbox" className="h-5 w-5" checked={f.liquor_enabled} onChange={(e) => set("liquor_enabled", e.target.checked)} />
            Sell liquor (shows the Liquor page, menu links and cards; OFF hides all of it)
          </label>
          <Field label="Liquor age text"><input className={inputCls} value={f.liquor_age_text} onChange={(e) => set("liquor_age_text", e.target.value)} /></Field>
          <button className={btnPrimary} disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
        </form>
      </Card>
    </div>
  );
}
