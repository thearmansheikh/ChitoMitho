"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { swapOrder } from "@/lib/admin";
import { btnDanger, btnGhost, btnPrimary, Card, Field, inputCls, Notice } from "@/components/admin/ui";
import type { Area, AreaGroup } from "@/types/db";

const GROUPS: AreaGroup[] = ["dharan", "itahari", "biratnagar", "nearby"];
const EMPTY = { name: "", name_ne: "", area_group: "dharan" as AreaGroup, charge: "" };

export default function AreasPage() {
  const sb = createClient();
  const [areas, setAreas] = useState<Area[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await createClient().from("areas").select("*").order("area_group").order("sort_order").order("name");
    if (error) setError(error.message); else setAreas(data as Area[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const charge = form.charge.trim() === "" ? null : Number(form.charge);
    if (charge !== null && (!Number.isFinite(charge) || charge < 0)) return setError("Enter the fixed delivery charge as a number, or leave it empty.");
    const row = { name: form.name.trim(), name_ne: form.name_ne.trim() || null, area_group: form.area_group, delivery_charge_npr: charge };
    const inGroup = areas.filter((a) => a.area_group === form.area_group);
    const res = editing
      ? await sb.from("areas").update(row).eq("id", editing)
      : await sb.from("areas").insert({ ...row, sort_order: (inGroup.at(-1)?.sort_order ?? 0) + 1 });
    if (res.error) return setError(/delivery_charge_npr/.test(res.error.message) ? "The delivery charge column is missing. Run supabase/migrations/0013_area_charges.sql in the Supabase SQL Editor first." : res.error.message);
    setEditing(null); setForm(EMPTY); load();
  }

  async function toggle(a: Area) {
    const { error } = await sb.from("areas").update({ is_active: !a.is_active }).eq("id", a.id);
    if (error) setError(error.message); else load();
  }

  async function move(a: Area, dir: -1 | 1) {
    const list = areas.filter((x) => x.area_group === a.area_group);
    const idx = list.findIndex((x) => x.id === a.id);
    const other = list[idx + dir];
    if (!other) return;
    if (a.sort_order === other.sort_order) {
      for (let k = 0; k < list.length; k++) await sb.from("areas").update({ sort_order: k + 1 }).eq("id", list[k].id);
      return load();
    }
    const err = await swapOrder(sb, "areas", a, other);
    if (err) setError(err.message); else load();
  }

  async function remove(a: Area) {
    if (!confirm(`Delete area "${a.name}"?`)) return;
    const { error } = await sb.from("areas").delete().eq("id", a.id);
    if (error) setError(error.message); else load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-blue">Delivery areas</h1>
      <Notice error={error} />
      <Card>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-4">
          <h2 className="font-bold sm:col-span-4">{editing ? "Edit area" : "Add area"}</h2>
          <Field label="Name"><input className={inputCls} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Nepali name"><input className={inputCls} value={form.name_ne} onChange={(e) => setForm({ ...form, name_ne: e.target.value })} /></Field>
          <Field label="Group">
            <select className={inputCls} value={form.area_group} onChange={(e) => setForm({ ...form, area_group: e.target.value as AreaGroup })}>
              {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Fixed delivery charge, Rs. (optional)">
            <input className={inputCls} inputMode="decimal" value={form.charge} onChange={(e) => setForm({ ...form, charge: e.target.value })} placeholder="e.g. 50" />
          </Field>
          <p className="text-xs text-slate-500 sm:col-span-4">Leave the charge empty when it depends on distance and the order. With a charge, customers are told it when they choose this area, and it goes into the WhatsApp order.</p>
          <div className="flex gap-2 sm:col-span-4">
            <button className={btnPrimary}>{editing ? "Save" : "Add area"}</button>
            {editing && <button type="button" className={btnGhost} onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancel</button>}
          </div>
        </form>
      </Card>

      {GROUPS.map((g) => {
        const list = areas.filter((a) => a.area_group === g);
        if (!list.length) return null;
        return (
          <section key={g} className="space-y-2">
            <h2 className="font-bold capitalize text-slate-700">{g}</h2>
            {list.map((a, i) => (
              <Card key={a.id} className={a.is_active ? "" : "opacity-60"}>
                <p className="font-semibold">{a.name} {a.name_ne && <span className="font-normal text-slate-500">· {a.name_ne}</span>} {a.delivery_charge_npr != null && <b className="text-brand-blue">· Rs. {Number(a.delivery_charge_npr)} delivery</b>}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className={btnGhost} aria-label={`Move ${a.name} up`} disabled={i === 0} onClick={() => move(a, -1)}>↑</button>
                  <button className={btnGhost} aria-label={`Move ${a.name} down`} disabled={i === list.length - 1} onClick={() => move(a, 1)}>↓</button>
                  <button className={btnGhost} onClick={() => toggle(a)}>{a.is_active ? "Deactivate" : "Activate"}</button>
                  <button className={btnGhost} onClick={() => { setEditing(a.id); setForm({ name: a.name, name_ne: a.name_ne ?? "", area_group: a.area_group, charge: a.delivery_charge_npr == null ? "" : String(Number(a.delivery_charge_npr)) }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
                  <button className={btnDanger} onClick={() => remove(a)}>Delete</button>
                </div>
              </Card>
            ))}
          </section>
        );
      })}
    </div>
  );
}
