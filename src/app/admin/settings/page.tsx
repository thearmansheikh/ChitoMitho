"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { btnPrimary, Card, Field, inputCls, Notice } from "@/components/admin/ui";
import type { Settings } from "@/types/db";

type Form = {
  whatsapp_number: string;
  phones: string;
  open_time: string;
  close_time: string;
  orders_paused: boolean;
  pause_message: string;
  announcement: string;
  liquor_age_text: string;
};

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
    setBusy(true);
    const { error } = await createClient().from("settings").upsert({
      id: 1,
      whatsapp_number: wa,
      phone_numbers: f.phones.split(",").map((p) => p.trim()).filter(Boolean),
      open_time: f.open_time,
      close_time: f.close_time,
      orders_paused: f.orders_paused,
      pause_message: f.pause_message.trim() || null,
      announcement: f.announcement.trim() || null,
      liquor_age_text: f.liquor_age_text.trim() || null,
    });
    setBusy(false);
    if (error) setError(error.message); else setOk("Settings saved. The site updates within a minute.");
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
          <label className="flex min-h-[44px] items-center gap-3 rounded-lg bg-slate-50 p-3 font-semibold">
            <input type="checkbox" className="h-5 w-5" checked={f.orders_paused} onChange={(e) => set("orders_paused", e.target.checked)} />
            Pause orders
          </label>
          <Field label="Pause message (rain, festival, busy…)"><input className={inputCls} value={f.pause_message} onChange={(e) => set("pause_message", e.target.value)} /></Field>
          <Field label="Top announcement banner"><input className={inputCls} value={f.announcement} onChange={(e) => set("announcement", e.target.value)} /></Field>
          <Field label="Liquor age text"><input className={inputCls} value={f.liquor_age_text} onChange={(e) => set("liquor_age_text", e.target.value)} /></Field>
          <button className={btnPrimary} disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
        </form>
      </Card>
    </div>
  );
}
