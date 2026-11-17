"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatNPR } from "@/lib/format";
import { btnDanger, btnGhost, btnPrimary, Card, Field, inputCls, Notice } from "@/components/admin/ui";
import type { Offer } from "@/types/db";

const EMPTY = { title: "", title_ne: "", body: "", body_ne: "", code: "", min: "", starts_on: "", ends_on: "" };

export default function OffersAdminPage() {
  const sb = createClient();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await createClient().from("offers").select("*").order("sort_order").order("created_at");
    if (error) setError(error.message);
    else setOffers(data as Offer[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    const code = form.code.replace(/\s+/g, "").toUpperCase();
    const min = form.min.trim() === "" ? null : Number(form.min);
    if (min !== null && (!Number.isFinite(min) || min < 0)) return setError("Enter a valid minimum order, or leave it empty.");
    if (form.starts_on && form.ends_on && form.ends_on < form.starts_on) return setError("The end date is before the start date.");
    const row = {
      title: form.title.trim(),
      title_ne: form.title_ne.trim() || null,
      body: form.body.trim() || null,
      body_ne: form.body_ne.trim() || null,
      code: code || null,
      min_order_npr: min,
      starts_on: form.starts_on || null,
      ends_on: form.ends_on || null,
    };
    const res = editing
      ? await sb.from("offers").update(row).eq("id", editing)
      : await sb.from("offers").insert({ ...row, is_active: false, sort_order: (offers.at(-1)?.sort_order ?? 0) + 1 });
    if (res.error) {
      return setError(res.error.code === "23505" ? "That code is already used by another offer." : res.error.message);
    }
    setOk(editing ? "Offer saved." : "Offer added, switched off. Turn it on when you are ready.");
    setEditing(null); setForm(EMPTY); load();
  }

  async function toggle(o: Offer) {
    const { error } = await sb.from("offers").update({ is_active: !o.is_active }).eq("id", o.id);
    if (error) setError(error.message); else load();
  }

  async function remove(o: Offer) {
    if (!confirm(`Delete the offer "${o.title}"?`)) return;
    const { error } = await sb.from("offers").delete().eq("id", o.id);
    if (error) setError(error.message); else load();
  }

  function startEdit(o: Offer) {
    setEditing(o.id);
    setForm({
      title: o.title, title_ne: o.title_ne ?? "", body: o.body ?? "", body_ne: o.body_ne ?? "", code: o.code ?? "",
      min: o.min_order_npr === null ? "" : String(o.min_order_npr), starts_on: o.starts_on ?? "", ends_on: o.ends_on ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-blue">Offers</h1>
      <p className="text-sm text-slate-600">
        Active offers appear on the home page as coupon tickets. If an offer has a code, customers can type it in the basket and it is added to the WhatsApp message for you to apply.
        New offers start switched off.
      </p>
      <Notice error={error} ok={ok} />

      <Card>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <h2 className="font-bold sm:col-span-2">{editing ? "Edit offer" : "Add offer"}</h2>
          <Field label="Title"><input className={inputCls} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Nepali title (optional)"><input className={inputCls} value={form.title_ne} onChange={(e) => setForm({ ...form, title_ne: e.target.value })} /></Field>
          <Field label="Short text (optional)"><input className={inputCls} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
          <Field label="Nepali short text (optional)"><input className={inputCls} value={form.body_ne} onChange={(e) => setForm({ ...form, body_ne: e.target.value })} /></Field>
          <Field label="Promo code (optional)"><input className={`${inputCls} font-mono uppercase tracking-widest`} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="FIRST" /></Field>
          <Field label="Minimum order in Rs. (optional)"><input className={inputCls} inputMode="decimal" value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value })} /></Field>
          <Field label="Starts on (optional)"><input className={inputCls} type="date" value={form.starts_on} onChange={(e) => setForm({ ...form, starts_on: e.target.value })} /></Field>
          <Field label="Ends on (optional)"><input className={inputCls} type="date" value={form.ends_on} onChange={(e) => setForm({ ...form, ends_on: e.target.value })} /></Field>
          <p className="text-xs text-slate-500 sm:col-span-2">Codes are visible on the offer ticket, so use them for public deals, not secret ones.</p>
          <div className="flex gap-2 sm:col-span-2">
            <button className={btnPrimary}>{editing ? "Save" : "Add offer"}</button>
            {editing && <button type="button" className={btnGhost} onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancel</button>}
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {offers.map((o) => (
          <Card key={o.id} className={o.is_active ? "" : "opacity-70"}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">{o.title} {o.title_ne && <span className="font-normal text-slate-500">· {o.title_ne}</span>}</p>
                {o.body && <p className="text-sm text-slate-600">{o.body}</p>}
                <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
                  {o.code && <span className="font-mono font-bold tracking-widest text-brand-blue">{o.code}</span>}
                  {o.min_order_npr !== null && <span>Min {formatNPR(Number(o.min_order_npr))}</span>}
                  {(o.starts_on || o.ends_on) && <span>{o.starts_on ?? "…"} to {o.ends_on ?? "…"}</span>}
                </p>
              </div>
              <span className={`flex-none rounded-full px-2.5 py-1 text-xs font-bold ${o.is_active ? "bg-green-100 text-green-900" : "bg-slate-200 text-slate-700"}`}>
                {o.is_active ? "On" : "Off"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className={btnGhost} onClick={() => toggle(o)}>{o.is_active ? "Switch off" : "Switch on"}</button>
              <button className={btnGhost} onClick={() => startEdit(o)}>Edit</button>
              <button className={btnDanger} onClick={() => remove(o)}>Delete</button>
            </div>
          </Card>
        ))}
        {offers.length === 0 && <p className="text-slate-500">No offers yet.</p>}
      </div>
    </div>
  );
}
