"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { nepalDates } from "@/lib/format";
import { btnDanger, btnPrimary, Card, Field, inputCls, Notice } from "@/components/admin/ui";
import type { Closure } from "@/types/db";

const EMPTY = { starts_on: "", ends_on: "", reason: "", message: "", message_ne: "" };

const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function ClosuresAdminPage() {
  const sb = createClient();
  const [rows, setRows] = useState<Closure[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const today = nepalDates().today;

  const load = useCallback(async () => {
    const { data, error } = await createClient().from("closures").select("*").order("starts_on", { ascending: false });
    if (error) setError(error.code === "42P01" ? "The closures table is missing. Run supabase/migrations/0007_closures.sql in the Supabase SQL Editor first." : error.message);
    else setRows(data as Closure[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    const start = form.starts_on, end = form.ends_on || form.starts_on;
    if (!start) return setError("Choose the first day of the closure.");
    if (end < start) return setError("The last day is before the first day.");
    const { error } = await sb.from("closures").insert({
      starts_on: start, ends_on: end, reason: form.reason.trim(),
      message: form.message.trim() || null, message_ne: form.message_ne.trim() || null,
    });
    if (error) return setError(error.message);
    setOk("Closure added. The site stops taking orders on those days and reopens by itself the day after. Changes show within about a minute.");
    setForm(EMPTY); load();
  }

  async function remove(c: Closure) {
    if (!confirm(`Delete the closure "${c.reason}" (${fmt(c.starts_on)} to ${fmt(c.ends_on)})?`)) return;
    const { error } = await sb.from("closures").delete().eq("id", c.id);
    if (error) setError(error.message); else load();
  }

  const status = (c: Closure) => (c.ends_on < today ? "Past" : c.starts_on <= today ? "On now" : "Upcoming");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-blue">Holiday closures</h1>
      <p className="text-sm text-slate-600">
        On the days you choose, the site shows a closed message and customers cannot send orders. It reopens by itself the day after the last day. Dates are Nepal dates.
      </p>
      <Notice error={error} ok={ok} />

      <Card>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <h2 className="font-bold sm:col-span-2">Add a closure</h2>
          <Field label="First day closed"><input className={inputCls} type="date" required min={today} value={form.starts_on} onChange={(e) => setForm({ ...form, starts_on: e.target.value })} /></Field>
          <Field label="Last day closed (leave empty for one day)"><input className={inputCls} type="date" min={form.starts_on || today} value={form.ends_on} onChange={(e) => setForm({ ...form, ends_on: e.target.value })} /></Field>
          <Field label="Reason (for your own list, and the default message)"><input className={inputCls} required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Dashain" /></Field>
          <span className="hidden sm:block" />
          <Field label="Message to customers (optional)"><input className={inputCls} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="We are closed for Dashain and reopen on 28 Oct." /></Field>
          <Field label="Nepali message (optional)"><input className={inputCls} value={form.message_ne} onChange={(e) => setForm({ ...form, message_ne: e.target.value })} /></Field>
          <p className="text-xs text-slate-500 sm:col-span-2">If you leave the message empty, customers see: “We are closed for [reason]. Orders open again after [last day].”</p>
          <div className="sm:col-span-2"><button className={btnPrimary}>Add closure</button></div>
        </form>
      </Card>

      <div className="space-y-3">
        {rows.map((c) => (
          <Card key={c.id} className={status(c) === "Past" ? "opacity-60" : ""}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">{c.reason}</p>
                <p className="text-sm text-slate-600">{c.starts_on === c.ends_on ? fmt(c.starts_on) : `${fmt(c.starts_on)} to ${fmt(c.ends_on)}`}</p>
                {c.message && <p className="mt-1 text-sm text-slate-600">“{c.message}”</p>}
              </div>
              <span className={`flex-none rounded-full px-2.5 py-1 text-xs font-bold ${status(c) === "On now" ? "bg-red-100 text-red-800" : status(c) === "Upcoming" ? "bg-yellow-100 text-yellow-900" : "bg-slate-200 text-slate-700"}`}>
                {status(c)}
              </span>
            </div>
            <div className="mt-3"><button className={btnDanger} onClick={() => remove(c)}>Delete</button></div>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-slate-500">No closures yet.</p>}
      </div>
    </div>
  );
}
