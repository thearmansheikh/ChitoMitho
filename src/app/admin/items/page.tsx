"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/admin";
import { formatNPR } from "@/lib/format";
import { btnDanger, btnGhost, btnPrimary, Card, Field, inputCls, Notice } from "@/components/admin/ui";
import { choiceLine, cleanOptions, parseChoiceLine } from "@/lib/options";
import type { Category, Item, Place } from "@/types/db";

/** One option group as typed in the form. Choices are one per line: "Large +50", "Regular", or "Large | ठूलो +50". */
interface OptGroupForm { name: string; name_ne: string; required: boolean; multi: boolean; choices: string }
const EMPTY_GROUP: OptGroupForm = { name: "", name_ne: "", required: false, multi: false, choices: "" };

function groupsToForm(value: unknown): OptGroupForm[] {
  return cleanOptions(value).map((g) => ({
    name: g.name, name_ne: g.name_ne ?? "", required: g.required, multi: g.multi,
    choices: g.choices.map((c) => (c.name_ne ? choiceLine({ name: `${c.name} | ${c.name_ne}`, price: c.price }) : choiceLine(c))).join("\n"),
  }));
}

/** Reads the form back into stored option groups, or returns a message saying what to fix. */
function formToGroups(groups: OptGroupForm[]): { ok: true; value: unknown[] } | { ok: false; error: string } {
  const value: unknown[] = [];
  for (const [gi, g] of groups.entries()) {
    const label = g.name.trim() || `Option ${gi + 1}`;
    if (!g.name.trim()) return { ok: false, error: `Option ${gi + 1} needs a name (for example Size).` };
    const choices = [];
    for (const line of g.choices.split("\n").map((l) => l.trim()).filter(Boolean)) {
      const c = parseChoiceLine(line);
      if (!c) return { ok: false, error: `Could not read the line "${line}" in ${label}. Write it like: Large +50` };
      const [en, ne] = c.name.split("|").map((s) => s.trim());
      choices.push({ name: en, name_ne: ne || null, price: c.price });
    }
    if (choices.length === 0) return { ok: false, error: `${label} needs at least one choice, one per line.` };
    value.push({ name: g.name.trim(), name_ne: g.name_ne.trim() || null, required: g.required, multi: g.multi, choices });
  }
  return { ok: true, value };
}

const EMPTY = { name: "", name_ne: "", unit: "", description: "", price: "", category_id: "", options: [] as OptGroupForm[] };

function ItemsManager() {
  const sb = createClient();
  const router = useRouter();
  const placeId = useSearchParams().get("place") ?? "";
  const [places, setPlaces] = useState<Place[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [hadOptions, setHadOptions] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [newCat, setNewCat] = useState({ name: "", name_ne: "" });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [menuPhotos, setMenuPhotos] = useState<{ name: string; url: string }[]>([]);
  const [uploadingMenu, setUploadingMenu] = useState(false);

  useEffect(() => {
    createClient().from("places").select("*").order("sort_order").then(({ data }) => setPlaces((data as Place[]) ?? []));
  }, []);

  const load = useCallback(async () => {
    if (!placeId) return;
    const c = createClient();
    const [cr, ir] = await Promise.all([
      c.from("categories").select("*").eq("place_id", placeId).order("sort_order"),
      c.from("items").select("*").eq("place_id", placeId).order("sort_order").order("name"),
    ]);
    if (cr.error || ir.error) setError((cr.error || ir.error)!.message);
    setCats((cr.data as Category[]) ?? []);
    setItems((ir.data as Item[]) ?? []);
    setPrices({});
    const list = await c.storage.from("media").list(`menu-photos/${placeId}`, { limit: 50, sortBy: { column: "created_at", order: "asc" } });
    setMenuPhotos((list.data ?? []).filter((f) => f.name && !f.name.startsWith(".")).map((f) => ({ name: f.name, url: c.storage.from("media").getPublicUrl(`menu-photos/${placeId}/${f.name}`).data.publicUrl })));
  }, [placeId]);
  useEffect(() => { load(); }, [load]);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { error } = await sb.from("categories").insert({
      place_id: placeId, name: newCat.name.trim(), name_ne: newCat.name_ne.trim() || null,
      sort_order: (cats.at(-1)?.sort_order ?? 0) + 1,
    });
    if (error) return setError(error.message);
    setNewCat({ name: "", name_ne: "" }); load();
  }

  async function deleteCategory(c: Category) {
    if (!confirm(`Delete category "${c.name}"? Its items stay, uncategorised.`)) return;
    const { error } = await sb.from("categories").delete().eq("id", c.id);
    if (error) setError(error.message); else load();
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) return setError("Enter a valid price.");
    const row = {
      name: form.name.trim(), name_ne: form.name_ne.trim() || null, unit: form.unit.trim() || null,
      description: form.description.trim() || null, price_npr: price,
      category_id: form.category_id || null,
    } as Record<string, unknown>;
    // Options are only sent when there is something to save or to clear, so items without options never touch that column.
    const parsed = formToGroups(form.options);
    if (!parsed.ok) return setError(parsed.error);
    if (parsed.value.length > 0 || hadOptions) row.options = parsed.value.length > 0 ? parsed.value : null;
    const res = editing
      ? await sb.from("items").update(row).eq("id", editing)
      : await sb.from("items").insert({ ...row, place_id: placeId, sort_order: (items.at(-1)?.sort_order ?? 0) + 1 });
    if (res.error) {
      if (/\bunit\b/.test(res.error.message)) return setError("The unit column is missing. Run supabase/migrations/0015_item_unit_and_combos.sql in the Supabase SQL Editor first.");
      return setError(/options/.test(res.error.message) ? "The options column is missing. Run supabase/migrations/0009_item_options.sql in the Supabase SQL Editor first." : res.error.message);
    }
    setEditing(null); setHadOptions(false); setForm(EMPTY); load();
  }

  function startEdit(i: Item) {
    setEditing(i.id);
    setHadOptions(cleanOptions(i.options).length > 0);
    setForm({ name: i.name, name_ne: i.name_ne ?? "", unit: i.unit ?? "", description: i.description ?? "", price: String(i.price_npr), category_id: i.category_id ?? "", options: groupsToForm(i.options) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggle(i: Item) {
    const { error } = await sb.from("items").update({ is_available: !i.is_available }).eq("id", i.id);
    if (error) setError(error.message); else load();
  }

  async function toggleFeatured(i: Item) {
    const { error } = await sb.from("items").update({ is_featured: !i.is_featured }).eq("id", i.id);
    if (error) setError(error.message); else load();
  }

  /** Saves a price typed straight into the item's card. */
  async function savePrice(i: Item) {
    const raw = prices[i.id];
    if (raw === undefined) return;
    const price = Number(raw.replace(/,/g, ""));
    if (raw.trim() === "" || !Number.isFinite(price) || price < 0) return setError(`"${raw}" is not a valid price for ${i.name}.`);
    setError(null); setOk(null);
    const { error } = await sb.from("items").update({ price_npr: price }).eq("id", i.id);
    if (error) return setError(error.message);
    setOk(`${i.name}: price is now ${formatNPR(price)}.`);
    load();
  }

  /** Makes a copy of an item (same category, price, unit and options) so a similar one is quick to add. */
  async function duplicate(i: Item) {
    setError(null); setOk(null);
    const copy: Record<string, unknown> = {
      place_id: i.place_id, category_id: i.category_id, name: `${i.name} (copy)`, name_ne: i.name_ne, description: i.description,
      unit: i.unit ?? null, price_npr: i.price_npr, image_url: i.image_url, is_available: true, is_featured: false,
      sort_order: Math.max(0, ...items.map((x) => x.sort_order)) + 1,
    };
    if (cleanOptions(i.options).length > 0) copy.options = i.options;
    const { error } = await sb.from("items").insert(copy);
    if (error) return setError(error.message);
    setOk(`Copied "${i.name}". Find "${i.name} (copy)" below and tap Edit to rename it.`);
    load();
  }

  /** Marks every item in one category sold out, or available again. */
  async function setCategoryAvailability(categoryId: string, label: string, available: boolean) {
    const n = items.filter((i) => (i.category_id ?? "") === categoryId && i.is_available !== available).length;
    if (n === 0) return setOk(available ? `Everything in ${label} is already available.` : `Everything in ${label} is already sold out.`);
    if (!confirm(available ? `Mark all ${n} items in "${label}" available again?` : `Mark all ${n} items in "${label}" sold out?`)) return;
    setError(null); setOk(null);
    const q = sb.from("items").update({ is_available: available }).eq("place_id", placeId);
    const { error } = await (categoryId ? q.eq("category_id", categoryId) : q.is("category_id", null));
    if (error) return setError(error.message);
    setOk(available ? `${n} items in ${label} are available again.` : `${n} items in ${label} are now sold out.`);
    load();
  }

  /** Keeps a picture of the paper menu for reference. Customers never see these. */
  async function addMenuPhoto(file?: File) {
    if (!file) return;
    setError(null); setOk(null); setUploadingMenu(true);
    try {
      await uploadImage(sb, file, `menu-photos/${placeId}`, 1600);
      setOk("Menu photo saved for reference.");
      await load();
    } catch (e) { setError((e as Error).message); }
    setUploadingMenu(false);
  }
  async function removeMenuPhoto(name: string) {
    if (!confirm("Delete this menu photo?")) return;
    const { error } = await sb.storage.from("media").remove([`menu-photos/${placeId}/${name}`]);
    if (error) setError(error.message); else load();
  }

  async function photo(i: Item, file?: File) {
    if (!file) return;
    try {
      const url = await uploadImage(sb, file, "items");
      const { error } = await sb.from("items").update({ image_url: url }).eq("id", i.id);
      if (error) throw error;
      load();
    } catch (e) { setError((e as Error).message); }
  }

  async function remove(i: Item) {
    if (!confirm(`Delete "${i.name}"?`)) return;
    const { error } = await sb.from("items").delete().eq("id", i.id);
    if (error) setError(error.message); else load();
  }

  const groups = [...cats.map((c) => ({ id: c.id, label: c.name })), { id: "", label: "Uncategorised" }]
    .map((g) => ({ ...g, items: items.filter((i) => (i.category_id ?? "") === g.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-blue">Items</h1>
      <Field label="Place">
        <select className={inputCls} value={placeId} onChange={(e) => router.push(`/admin/items?place=${e.target.value}`)}>
          <option value="">Choose a place…</option>
          {places.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
        </select>
      </Field>
      <Notice error={error} ok={ok} />

      {placeId && (
        <>
          <Card>
            <h2 className="mb-2 font-bold">Categories</h2>
            <ul className="mb-3 flex flex-wrap gap-2">
              {cats.map((c) => (
                <li key={c.id} className="flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-sm">
                  {c.name}
                  <button aria-label={`Delete category ${c.name}`} className="h-8 w-8 rounded-full text-brand-red" onClick={() => deleteCategory(c)}>×</button>
                </li>
              ))}
            </ul>
            <form onSubmit={addCategory} className="flex flex-wrap gap-2">
              <input className={`${inputCls} flex-1`} required placeholder="Category name" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
              <input className={`${inputCls} flex-1`} placeholder="Nepali name" value={newCat.name_ne} onChange={(e) => setNewCat({ ...newCat, name_ne: e.target.value })} />
              <button className={btnPrimary}>Add</button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-1 font-bold">Menu photos (for reference)</h2>
            <p className="mb-3 text-sm text-slate-600">Keep a picture of the paper menu here so you can check prices while typing. Customers never see these.</p>
            {menuPhotos.length > 0 && (
              <ul className="mb-3 flex flex-wrap gap-3">
                {menuPhotos.map((m) => (
                  <li key={m.name} className="w-28 space-y-1">
                    <a href={m.url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt="Menu photo (tap to open full size)" className="h-28 w-28 rounded-lg object-cover ring-1 ring-slate-200" />
                    </a>
                    <button type="button" className={`${btnDanger} w-full`} onClick={() => removeMenuPhoto(m.name)}>Delete</button>
                  </li>
                ))}
              </ul>
            )}
            <label className={`${btnGhost} inline-flex cursor-pointer items-center`}>
              {uploadingMenu ? "Uploading…" : "Add a menu photo"}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { addMenuPhoto(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
          </Card>

          <Card>
            <form onSubmit={saveItem} className="grid gap-3 sm:grid-cols-2">
              <h2 className="font-bold sm:col-span-2">{editing ? "Edit item" : "Add item"}</h2>
              <Field label="Name"><input className={inputCls} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Nepali name (optional)"><input className={inputCls} value={form.name_ne} onChange={(e) => setForm({ ...form, name_ne: e.target.value })} /></Field>
              <Field label="Unit or size (optional)"><input className={inputCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. 5 kg, 650 ml, 1 lb" /></Field>
              <Field label="Price (Rs.)"><input className={inputCls} required inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
              <Field label="Category">
                <select className={inputCls} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">None</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <div className="sm:col-span-2"><Field label="Description"><input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
              <fieldset className="space-y-3 sm:col-span-2">
                <legend className="font-semibold text-slate-700">Options (size, extras, optional)</legend>
                <p className="text-sm text-slate-600">
                  Let customers choose, for example a size or extra cheese. Their choice and its price appear in the WhatsApp order.
                  Write one choice per line, with a price to add after it: <code>Large +50</code>. Leave the price off when it costs nothing: <code>Regular</code>.
                </p>
                {form.options.map((g, gi) => {
                  const set = (patch: Partial<OptGroupForm>) => setForm({ ...form, options: form.options.map((x, j) => (j === gi ? { ...x, ...patch } : x)) });
                  return (
                    <div key={gi} className="space-y-2 rounded-lg border border-slate-200 p-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Field label="Option name"><input className={inputCls} value={g.name} onChange={(e) => set({ name: e.target.value })} placeholder="Size" /></Field>
                        <Field label="Nepali name (optional)"><input className={inputCls} value={g.name_ne} onChange={(e) => set({ name_ne: e.target.value })} /></Field>
                      </div>
                      <Field label="Choices, one per line"><textarea className={inputCls} rows={4} value={g.choices} onChange={(e) => set({ choices: e.target.value })} placeholder={"Regular\nLarge +50"} /></Field>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                        <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" className="h-5 w-5" checked={g.required} onChange={(e) => set({ required: e.target.checked })} /> Customer must choose</label>
                        <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" className="h-5 w-5" checked={g.multi} onChange={(e) => set({ multi: e.target.checked })} /> Can choose more than one</label>
                        <button type="button" className={btnDanger} onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== gi) })}>Remove option</button>
                      </div>
                    </div>
                  );
                })}
                {form.options.length < 6 && (
                  <button type="button" className={btnGhost} onClick={() => setForm({ ...form, options: [...form.options, { ...EMPTY_GROUP }] })}>+ Add an option</button>
                )}
              </fieldset>
              <div className="flex gap-2 sm:col-span-2">
                <button className={btnPrimary}>{editing ? "Save" : "Add item"}</button>
                {editing && <button type="button" className={btnGhost} onClick={() => { setEditing(null); setHadOptions(false); setForm(EMPTY); }}>Cancel</button>}
              </div>
            </form>
          </Card>

          {groups.map((g) => (
            <section key={g.id || "none"} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold text-slate-700">{g.label} <span className="font-normal text-slate-500">({g.items.length})</span></h2>
                <div className="flex flex-wrap gap-2">
                  <button className={btnGhost} onClick={() => setCategoryAvailability(g.id, g.label, false)}>Mark all sold out</button>
                  <button className={btnGhost} onClick={() => setCategoryAvailability(g.id, g.label, true)}>Mark all available</button>
                </div>
              </div>
              {g.items.map((i) => (
                <Card key={i.id} className={i.is_available ? "" : "opacity-60"}>
                  <div className="flex items-center gap-3">
                    {i.image_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={i.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      : <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100" aria-hidden>🍽️</div>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{i.name}{i.unit && <span className="font-normal text-slate-600"> · {i.unit}</span>} {i.name_ne && <span className="font-normal text-slate-500">· {i.name_ne}</span>}</p>
                      <p className="text-sm text-slate-600">{!i.is_available && <b className="text-brand-red">· Sold out</b>} {i.is_featured && <b className="text-brand-blue">· ★ On home page</b>} {cleanOptions(i.options).length > 0 && <b className="text-slate-700">· {cleanOptions(i.options).length} option{cleanOptions(i.options).length === 1 ? "" : "s"}</b>}</p>
                    </div>
                  </div>
                  <form className="mt-3 flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); savePrice(i); }}>
                    <label className="text-sm font-semibold text-slate-700" htmlFor={`price-${i.id}`}>Price Rs.</label>
                    <input
                      id={`price-${i.id}`} inputMode="decimal" className={`${inputCls} w-28`}
                      value={prices[i.id] ?? String(i.price_npr)}
                      onChange={(e) => setPrices({ ...prices, [i.id]: e.target.value })}
                    />
                    {prices[i.id] !== undefined && prices[i.id] !== String(i.price_npr) && <button className={btnPrimary}>Save price</button>}
                  </form>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className={btnGhost} onClick={() => toggle(i)}>{i.is_available ? "Mark sold out" : "Mark available"}</button>
                    <button className={btnGhost} aria-pressed={i.is_featured} onClick={() => toggleFeatured(i)}>
                      {i.is_featured ? "★ Featured · remove" : "☆ Feature on home"}
                    </button>
                    <button className={btnGhost} onClick={() => startEdit(i)}>Edit</button>
                    <button className={btnGhost} onClick={() => duplicate(i)}>Duplicate</button>
                    <label className={`${btnGhost} flex cursor-pointer items-center`}>
                      Photo
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => photo(i, e.target.files?.[0])} />
                    </label>
                    <button className={btnDanger} onClick={() => remove(i)}>Delete</button>
                  </div>
                </Card>
              ))}
            </section>
          ))}
          {items.length === 0 && <p className="text-slate-500">No items yet for this place.</p>}
        </>
      )}
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense>
      <ItemsManager />
    </Suspense>
  );
}
