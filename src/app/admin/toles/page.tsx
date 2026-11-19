"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { btnDanger, btnGhost, btnPrimary, Card, Field, inputCls, Notice } from "@/components/admin/ui";
import type { Area, Tole } from "@/types/db";

const ANY = "any";
const MAX_LINES = 300;

export default function TolesAdminPage() {
  const sb = createClient();
  const [areas, setAreas] = useState<Area[]>([]);
  const [toles, setToles] = useState<Tole[]>([]);
  const [areaId, setAreaId] = useState<string>(ANY);
  const [filter, setFilter] = useState<string>("all");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const c = createClient();
    const [a, t] = await Promise.all([
      c.from("areas").select("*").order("area_group").order("sort_order").order("name"),
      c.from("toles").select("*").order("name").limit(5000),
    ]);
    if (a.error) return setError(a.error.message);
    setAreas(a.data as Area[]);
    if (t.error) {
      setError(t.error.code === "42P01" ? "The toles table is missing. Run supabase/migrations/0011_toles.sql in the Supabase SQL Editor first." : t.error.message);
    } else setToles(t.data as Tole[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const areaName = (id: string | null) => (id ? areas.find((a) => a.id === id)?.name ?? "Unknown area" : "Suggested everywhere");

  /** One tole per line. "Hatkhola" or "Hatkhola | हाटखोला". Commas also separate toles, so a pasted list works. */
  const parsed = useMemo(() => {
    const seen = new Set<string>();
    const rows: { name: string; name_ne: string | null }[] = [];
    for (const raw of text.split(/\r?\n|,/)) {
      const [en, ne] = raw.split("|").map((s) => s.trim());
      const name = (en ?? "").replace(/\s+/g, " ");
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ name: name.slice(0, 80), name_ne: ne ? ne.slice(0, 80) : null });
    }
    return rows;
  }, [text]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    if (parsed.length === 0) return setError("Type or paste at least one tole.");
    if (parsed.length > MAX_LINES) return setError(`Add at most ${MAX_LINES} toles at a time.`);
    const target = areaId === ANY ? null : areaId;
    // Skip toles that are already listed for this area (the database also refuses duplicates).
    const have = new Set(toles.filter((t) => t.area_id === target).map((t) => t.name.trim().toLowerCase()));
    const fresh = parsed.filter((r) => !have.has(r.name.toLowerCase()));
    if (fresh.length === 0) return setOk("Those toles are already in the list.");
    setBusy(true);
    const { error } = await sb.from("toles").insert(fresh.map((r) => ({ ...r, area_id: target })));
    setBusy(false);
    if (error) return setError(error.code === "42P01" ? "The toles table is missing. Run supabase/migrations/0011_toles.sql in the Supabase SQL Editor first." : error.message);
    const skipped = parsed.length - fresh.length;
    setOk(`Added ${fresh.length} ${fresh.length === 1 ? "tole" : "toles"}${skipped ? ` (${skipped} already there)` : ""}. Customers see them within about a minute of opening the form.`);
    setText(""); load();
  }

  async function toggle(t: Tole) {
    const { error } = await sb.from("toles").update({ is_active: !t.is_active }).eq("id", t.id);
    if (error) setError(error.message); else load();
  }

  async function remove(t: Tole) {
    if (!confirm(`Delete the tole "${t.name}"?`)) return;
    const { error } = await sb.from("toles").delete().eq("id", t.id);
    if (error) setError(error.message); else load();
  }

  const shown = toles.filter((t) => filter === "all" || (filter === ANY ? t.area_id === null : t.area_id === filter));
  const byArea = useMemo(() => {
    const m = new Map<string, Tole[]>();
    shown.forEach((t) => { const k = t.area_id ?? ANY; m.set(k, [...(m.get(k) ?? []), t]); });
    return [...m.entries()];
  }, [shown]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-blue">Toles</h1>
      <p className="text-sm text-slate-600">
        Toles and streets that customers can pick while typing their address, so riders get clear directions.
        Choose the ward they belong to, then type or paste them, one per line. Customers can still type a tole that is not listed here.
      </p>
      <Notice error={error} ok={ok} />

      <Card>
        <form onSubmit={add} className="space-y-3">
          <h2 className="font-bold">Add toles</h2>
          <Field label="Ward or area">
            <select className={inputCls} value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              <option value={ANY}>Suggest everywhere (no particular ward)</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Toles, one per line">
            <textarea className={inputCls} rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={"Hatkhola\nChatara Line | चतरा लाइन\nGhopa Camp"} />
          </Field>
          <p className="text-xs text-slate-500">
            Add a Nepali spelling after a bar if you like: <code>Hatkhola | हाटखोला</code>. {parsed.length > 0 && <b>{parsed.length} ready to add.</b>}
          </p>
          <button className={btnPrimary} disabled={busy || parsed.length === 0}>{busy ? "Adding…" : "Add toles"}</button>
        </form>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-semibold text-slate-700" htmlFor="toles-filter">Show</label>
        <select id="toles-filter" className={`${inputCls} max-w-xs`} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All toles ({toles.length})</option>
          <option value={ANY}>Suggested everywhere</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {byArea.length === 0 && <p className="text-slate-500">No toles yet. Add the first ones above.</p>}
      {byArea.map(([k, list]) => (
        <Card key={k}>
          <h2 className="mb-2 font-bold">{areaName(k === ANY ? null : k)} <span className="font-normal text-slate-500">· {list.length}</span></h2>
          <ul className="divide-y divide-slate-100">
            {list.map((t) => (
              <li key={t.id} className={`flex flex-wrap items-center justify-between gap-2 py-2 ${t.is_active ? "" : "opacity-60"}`}>
                <span className="min-w-0">{t.name}{t.name_ne && <span className="text-slate-500"> · {t.name_ne}</span>}{!t.is_active && <b className="ml-2 text-xs text-slate-600">hidden</b>}</span>
                <span className="flex gap-2">
                  <button type="button" className={btnGhost} onClick={() => toggle(t)}>{t.is_active ? "Hide" : "Show"}</button>
                  <button type="button" className={btnDanger} onClick={() => remove(t)}>Delete</button>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
