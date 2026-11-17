"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { slugify, swapOrder, uploadImage } from "@/lib/admin";
import { btnDanger, btnGhost, btnPrimary, Card, Field, inputCls, Notice } from "@/components/admin/ui";
import type { Place, PlaceType } from "@/types/db";

const TYPES: PlaceType[] = ["food", "grocery", "liquor", "gifts"];
const EMPTY = {
  name: "", name_ne: "", slug: "", type: "food" as PlaceType, description: "",
  address: "", maps_url: "", opens_at: "", closes_at: "",
};

export default function PlacesPage() {
  const sb = createClient();
  const [places, setPlaces] = useState<Place[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await createClient().from("places").select("*").order("sort_order").order("name");
    if (error) setError(error.message);
    else setPlaces(data as Place[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  function startEdit(p: Place) {
    setEditing(p.id);
    setForm({
      name: p.name, name_ne: p.name_ne ?? "", slug: p.slug, type: p.type, description: p.description ?? "",
      address: p.address ?? "", maps_url: p.maps_url ?? "",
      opens_at: p.opens_at?.slice(0, 5) ?? "", closes_at: p.closes_at?.slice(0, 5) ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function reset() { setEditing(null); setForm(EMPTY); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    const maps = form.maps_url.trim();
    if (maps && !/^https?:\/\//i.test(maps)) return setError("The map link must start with https://");
    if (Boolean(form.opens_at) !== Boolean(form.closes_at)) return setError("Set both opening and closing time, or leave both empty.");
    setBusy(true);
    const row = {
      name: form.name.trim(),
      name_ne: form.name_ne.trim() || null,
      slug: slugify(form.slug || form.name),
      type: form.type,
      description: form.description.trim() || null,
      address: form.address.trim() || null,
      maps_url: maps || null,
      opens_at: form.opens_at || null,
      closes_at: form.closes_at || null,
    };
    const res = editing
      ? await sb.from("places").update(row).eq("id", editing)
      : await sb.from("places").insert({ ...row, sort_order: (places.at(-1)?.sort_order ?? 0) + 1 });
    setBusy(false);
    if (res.error) return setError(res.error.message);
    setOk(editing ? "Place updated." : "Place added.");
    reset(); load();
  }

  async function toggle(p: Place) {
    const { error } = await sb.from("places").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) setError(error.message); else load();
  }

  async function move(i: number, dir: -1 | 1) {
    const a = places[i], b = places[i + dir];
    if (!a || !b) return;
    // Equal sort_order values would make the swap a no-op, so normalise first.
    if (a.sort_order === b.sort_order) {
      for (let k = 0; k < places.length; k++) await sb.from("places").update({ sort_order: k + 1 }).eq("id", places[k].id);
      return load();
    }
    const err = await swapOrder(sb, "places", a, b);
    if (err) setError(err.message); else load();
  }

  async function logo(p: Place, file?: File) {
    if (!file) return;
    setError(null);
    try {
      const url = await uploadImage(sb, file, "logos");
      const { error } = await sb.from("places").update({ logo_url: url }).eq("id", p.id);
      if (error) throw error;
      load();
    } catch (e) { setError((e as Error).message); }
  }

  async function cover(p: Place, file?: File) {
    if (!file) return;
    setError(null);
    try {
      const url = await uploadImage(sb, file, "covers");
      const { error } = await sb.from("places").update({ cover_url: url }).eq("id", p.id);
      if (error) throw error;
      load();
    } catch (e) { setError((e as Error).message); }
  }

  async function remove(p: Place) {
    if (!confirm(`Delete "${p.name}" and all its items?`)) return;
    const { error } = await sb.from("places").delete().eq("id", p.id);
    if (error) setError(error.message); else load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-blue">Places</h1>
      <Notice error={error} ok={ok} />

      <Card>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
          <h2 className="font-bold sm:col-span-2">{editing ? "Edit place" : "Add place"}</h2>
          <Field label="Name"><input className={inputCls} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Nepali name (optional)"><input className={inputCls} value={form.name_ne} onChange={(e) => setForm({ ...form, name_ne: e.target.value })} /></Field>
          <Field label="Type">
            <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PlaceType })}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="URL slug (auto if empty)"><input className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder={slugify(form.name)} /></Field>
          <div className="sm:col-span-2"><Field label="Description"><input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          <div className="sm:col-span-2"><Field label="Address or area (optional)"><input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Bhanu Chowk, near Nabil Bank" /></Field></div>
          <div className="sm:col-span-2"><Field label="Google Maps link (optional)"><input className={inputCls} inputMode="url" value={form.maps_url} onChange={(e) => setForm({ ...form, maps_url: e.target.value })} placeholder="https://maps.app.goo.gl/…" /></Field></div>
          <Field label="Opens (optional)"><input type="time" className={inputCls} value={form.opens_at} onChange={(e) => setForm({ ...form, opens_at: e.target.value })} /></Field>
          <Field label="Closes (optional)"><input type="time" className={inputCls} value={form.closes_at} onChange={(e) => setForm({ ...form, closes_at: e.target.value })} /></Field>
          <p className="text-xs text-slate-500 sm:col-span-2">Leave the times empty if this place keeps the shop’s hours. Upload a logo or cover photo with the buttons on the place’s card below.</p>
          <div className="flex gap-2 sm:col-span-2">
            <button className={btnPrimary} disabled={busy}>{editing ? "Save" : "Add place"}</button>
            {editing && <button type="button" className={btnGhost} onClick={reset}>Cancel</button>}
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {places.map((p, i) => (
          <Card key={p.id} className={p.is_active ? "" : "opacity-60"}>
            <div className="flex items-center gap-3">
              {p.logo_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.logo_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                : <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xl" aria-hidden>🏪</div>}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{p.name} {p.name_ne && <span className="font-normal text-slate-500">· {p.name_ne}</span>}</p>
                <p className="text-sm text-slate-500">{p.type} · /p/{p.slug}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className={btnGhost} aria-label={`Move ${p.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button className={btnGhost} aria-label={`Move ${p.name} down`} disabled={i === places.length - 1} onClick={() => move(i, 1)}>↓</button>
              <button className={btnGhost} onClick={() => toggle(p)}>{p.is_active ? "Deactivate" : "Activate"}</button>
              <button className={btnGhost} onClick={() => startEdit(p)}>Edit</button>
              <Link className={`${btnGhost} flex items-center`} href={`/admin/items?place=${p.id}`}>Items</Link>
              <label className={`${btnGhost} flex cursor-pointer items-center`}>
                Logo
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => logo(p, e.target.files?.[0])} />
              </label>
              <label className={`${btnGhost} flex cursor-pointer items-center`}>
                {p.cover_url ? "Change cover" : "Cover photo"}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => cover(p, e.target.files?.[0])} />
              </label>
              <button className={btnDanger} onClick={() => remove(p)}>Delete</button>
            </div>
          </Card>
        ))}
        {places.length === 0 && <p className="text-slate-500">No places yet.</p>}
      </div>
    </div>
  );
}
