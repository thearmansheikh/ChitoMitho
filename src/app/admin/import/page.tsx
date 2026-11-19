"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatNPR } from "@/lib/format";
import {
  CSV_TEMPLATE, EXAMPLE_MENU, MAX_ROWS, newCategoryNames, norm, parseMenu, planImport,
  type ExistingCategory, type ExistingItem, type PlannedRow,
} from "@/lib/menuImport";
import { btnGhost, btnPrimary, Card, Field, inputCls, Notice } from "@/components/admin/ui";
import type { Place } from "@/types/db";

type DbItem = ExistingItem & { sort_order: number };

const CHUNK = 100;

export default function ImportPage() {
  const sb = createClient();
  const [places, setPlaces] = useState<Place[]>([]);
  const [placeId, setPlaceId] = useState("");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [updatePrices, setUpdatePrices] = useState(true);
  const [left, setLeft] = useState<Set<number>>(new Set()); // lines the person unticked
  const [cats, setCats] = useState<ExistingCategory[]>([]);
  const [items, setItems] = useState<DbItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    createClient().from("places").select("*").order("sort_order").then(({ data, error }) => {
      if (error) setError(error.message); else setPlaces((data as Place[]) ?? []);
    });
  }, []);

  const loadPlace = useCallback(async (id: string) => {
    if (!id) { setCats([]); setItems([]); return; }
    const c = createClient();
    const [cr, ir] = await Promise.all([
      c.from("categories").select("id,name,sort_order").eq("place_id", id),
      c.from("items").select("id,name,name_ne,price_npr,category_id,sort_order").eq("place_id", id),
    ]);
    if (cr.error || ir.error) setError((cr.error || ir.error)!.message);
    setCats((cr.data as ExistingCategory[]) ?? []);
    setItems(((ir.data as DbItem[]) ?? []).map((i) => ({ ...i, price_npr: Number(i.price_npr) })));
  }, []);
  useEffect(() => { loadPlace(placeId); }, [placeId, loadPlace]);

  const parsed = useMemo(() => parseMenu(text), [text]);
  const plan = useMemo(() => planImport(parsed.rows, items, updatePrices), [parsed.rows, items, updatePrices]);
  const included = useMemo(() => plan.filter((p) => (p.action === "new" || p.action === "update") && !left.has(p.line)), [plan, left]);
  const toCreate = useMemo(() => newCategoryNames(included, cats), [included, cats]);

  const count = (a: PlannedRow["action"]) => plan.filter((p) => p.action === a).length;
  const errors = plan.filter((p) => p.error).length;
  const nNew = included.filter((p) => p.action === "new").length;
  const nUpdate = included.filter((p) => p.action === "update").length;

  async function readFile(file?: File) {
    if (!file) return;
    setError(null); setDone(null);
    if (file.size > 1_000_000) return setError("That file is too big. Menus should be well under 1 MB.");
    if (/\.(xlsx?|ods)$/i.test(file.name)) return setError("Excel files cannot be read directly. In Excel choose Save As and pick CSV, or select the cells and paste them here.");
    setFileName(file.name);
    setText(await file.text());
    setLeft(new Set());
  }

  async function run() {
    setBusy(true); setError(null); setDone(null);
    let madeCats = 0, madeItems = 0, changed = 0;
    try {
      const catIds = new Map(cats.map((c) => [norm(c.name), c.id]));
      if (toCreate.length) {
        const base = Math.max(0, ...cats.map((c) => c.sort_order));
        const { data, error } = await sb.from("categories")
          .insert(toCreate.map((name, i) => ({ place_id: placeId, name, sort_order: base + i + 1 })))
          .select("id,name");
        if (error) throw error;
        (data ?? []).forEach((c) => catIds.set(norm(c.name), c.id));
        madeCats = data?.length ?? 0;
      }

      const sortBase = Math.max(0, ...items.map((i) => i.sort_order));
      const rows = included.filter((r) => r.action === "new").map((r, i) => ({
        place_id: placeId,
        category_id: r.category ? catIds.get(norm(r.category)) ?? null : null,
        name: r.name,
        name_ne: r.nameNe || null,
        description: r.description || null,
        price_npr: r.price,
        sort_order: sortBase + i + 1,
      }));
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { error } = await sb.from("items").insert(rows.slice(i, i + CHUNK));
        if (error) throw error;
        madeItems += Math.min(CHUNK, rows.length - i);
      }

      const updates = included.filter((r) => r.action === "update");
      for (let i = 0; i < updates.length; i += 10) {
        const results = await Promise.all(updates.slice(i, i + 10).map((r) => {
          const old = items.find((x) => x.id === r.existingId);
          const patch: { price_npr: number | null; name_ne?: string } = { price_npr: r.price };
          if (r.nameNe && old && !old.name_ne) patch.name_ne = r.nameNe; // only fill an empty Nepali name
          return sb.from("items").update(patch).eq("id", r.existingId!);
        }));
        const bad = results.find((x) => x.error);
        if (bad?.error) throw bad.error;
        changed += results.length;
      }

      setDone(`Done. Added ${madeItems} item${madeItems === 1 ? "" : "s"}${madeCats ? ` and ${madeCats} categor${madeCats === 1 ? "y" : "ies"}` : ""}${changed ? `, updated ${changed} price${changed === 1 ? "" : "s"}` : ""}. The site shows them within about a minute.`);
      setLeft(new Set());
      await loadPlace(placeId);
    } catch (e) {
      const msg = (e as { message?: string }).message ?? "Something went wrong.";
      setError(`${msg} What was saved before the problem: ${madeCats} categories, ${madeItems} items, ${changed} price changes. Run the import again to finish. Nothing is added twice.`);
      await loadPlace(placeId);
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    // A byte-order mark makes Excel show Nepali text correctly.
    const url = URL.createObjectURL(new Blob(["\uFEFF" + CSV_TEMPLATE], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "menu-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const placeName = places.find((p) => p.id === placeId)?.name;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-blue">Import a menu</h1>
      <p className="text-sm text-slate-600">
        Paste a whole menu, or upload a CSV file, instead of adding items one by one. You see a preview first. Nothing is ever deleted, and running it twice never adds an item twice.
      </p>
      <Notice error={error} ok={done} />

      <Card className="space-y-3">
        <Field label="1. Which place is this menu for?">
          <select className={inputCls} value={placeId} onChange={(e) => { setPlaceId(e.target.value); setDone(null); setLeft(new Set()); }}>
            <option value="">Choose a place…</option>
            {places.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
          </select>
        </Field>

        <Field label="2. Paste the menu, or upload a file">
          <textarea
            className={`${inputCls} min-h-[180px] font-mono text-sm`}
            value={text} onChange={(e) => { setText(e.target.value); setLeft(new Set()); setDone(null); }}
            placeholder={"Momo\nChicken Momo 250\nVeg Momo 200\n\nDrinks\nCold Coffee 180"}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <label className={`${btnGhost} flex cursor-pointer items-center`}>
            Upload CSV or text file
            <input type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" className="sr-only" onChange={(e) => readFile(e.target.files?.[0])} />
          </label>
          <button type="button" className={btnGhost} onClick={downloadTemplate}>Download CSV template</button>
          <button type="button" className={btnGhost} onClick={() => { setText(EXAMPLE_MENU); setFileName(""); setLeft(new Set()); setDone(null); }}>Use an example</button>
          {text && <button type="button" className={btnGhost} onClick={() => { setText(""); setFileName(""); setLeft(new Set()); }}>Clear</button>}
          {fileName && <span className="text-sm text-slate-600">{fileName}</span>}
        </div>

        <details className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <summary className="min-h-[44px] cursor-pointer py-2 font-semibold">What formats work?</summary>
          <div className="space-y-2 pb-2">
            <p><b>A typed list.</b> A line without a price starts a category. Each item line ends with its price. Bullets, numbers, “Rs.” and commas in prices are fine.</p>
            <pre className="overflow-x-auto rounded bg-white p-2 text-xs">{EXAMPLE_MENU}</pre>
            <p><b>A table from Excel or Google Sheets.</b> Select the cells, copy, and paste here. Columns can be <i>Category, Name, Price, Nepali name, Description</i>. With a header row they can be in any order. Without one, the column that holds the price is found for you.</p>
            <p><b>A CSV file.</b> Comma, semicolon or pipe (|) separated. Names with commas should be in quotes.</p>
            <p>Up to {MAX_ROWS} lines at a time. Excel files (.xlsx) must be saved as CSV first.</p>
          </div>
        </details>
      </Card>

      {text.trim() && (
        <Card className="space-y-3">
          <h2 className="font-bold">3. Check the preview</h2>
          <p className="text-sm text-slate-600">
            Read as {parsed.format === "plain" ? "a typed list" : `a table (${parsed.delimiter}-separated${parsed.hadHeader ? ", with a header row" : ""})`}.
            {" "}{plan.length} line{plan.length === 1 ? "" : "s"} found.
          </p>
          <div className="flex flex-wrap gap-2 text-sm font-semibold">
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-900">{count("new")} new</span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-900">{count("update")} price changes</span>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">{count("same")} already there</span>
            {errors > 0 && <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">{errors} need fixing</span>}
          </div>

          <label className="flex min-h-[44px] items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm font-semibold">
            <input type="checkbox" className="h-5 w-5" checked={updatePrices} onChange={(e) => { setUpdatePrices(e.target.checked); setLeft(new Set()); }} />
            Update the price of items that are already on the menu
          </label>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[620px] border-collapse text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="p-2">Add</th><th className="p-2">Line</th><th className="p-2">Category</th><th className="p-2">Item</th><th className="p-2">Price</th><th className="p-2">What happens</th></tr>
              </thead>
              <tbody>
                {plan.map((p) => {
                  const can = p.action === "new" || p.action === "update";
                  const on = can && !left.has(p.line);
                  const tone = p.action === "new" ? "text-green-800" : p.action === "update" ? "text-blue-800" : p.error ? "text-red-700" : "text-slate-500";
                  return (
                    <tr key={p.line} className={`border-t border-slate-100 ${on ? "" : "opacity-60"}`}>
                      <td className="p-2">
                        <input
                          type="checkbox" className="h-5 w-5" disabled={!can} checked={on}
                          aria-label={`Include line ${p.line}: ${p.name}`}
                          onChange={(e) => setLeft((s) => { const n = new Set(s); if (e.target.checked) n.delete(p.line); else n.add(p.line); return n; })}
                        />
                      </td>
                      <td className="p-2 text-slate-500">{p.line}</td>
                      <td className="p-2">{p.category || <span className="text-slate-400">none</span>}</td>
                      <td className="p-2 font-semibold">
                        {p.name || <span className="text-slate-400">—</span>}
                        {p.nameNe && <span className="block text-xs font-normal text-slate-500">{p.nameNe}</span>}
                      </td>
                      <td className="p-2 whitespace-nowrap">{p.price === null ? "—" : formatNPR(p.price)}</td>
                      <td className={`p-2 ${tone}`}>{p.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {toCreate.length > 0 && (
            <p className="text-sm text-slate-700">New categories that will be created: <b>{toCreate.join(", ")}</b></p>
          )}
          {parsed.rows.length >= MAX_ROWS && <p className="text-sm font-semibold text-yellow-800">Only the first {MAX_ROWS} lines are read. Import in parts for a longer menu.</p>}

          <button className={`${btnPrimary} w-full sm:w-auto`} disabled={busy || !placeId || included.length === 0} onClick={run}>
            {busy ? "Importing…" : !placeId ? "Choose a place first" : included.length === 0 ? "Nothing to import" : `Import ${nNew} new${nUpdate ? ` and update ${nUpdate}` : ""} into ${placeName}`}
          </button>
          {done && placeId && <p className="text-sm"><Link className="font-semibold text-brand-blue underline" href={`/admin/items?place=${placeId}`}>Open this place’s items</Link> to add photos or mark anything sold out.</p>}
        </Card>
      )}
    </div>
  );
}
