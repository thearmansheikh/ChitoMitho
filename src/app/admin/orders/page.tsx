"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NPT_OFFSET_MINUTES, formatNPR } from "@/lib/format";
import { Card, Notice } from "@/components/admin/ui";
import type { Area, OrderClick, Place } from "@/types/db";

const MIN = 60_000;

/** Start of the Nepal-time day/week/month containing `now`, as a UTC Date. */
function boundaries(now = new Date()) {
  const npt = new Date(now.getTime() + NPT_OFFSET_MINUTES * MIN); // fields read via getUTC*
  const y = npt.getUTCFullYear(), m = npt.getUTCMonth(), d = npt.getUTCDate();
  const toUtc = (ms: number) => new Date(ms - NPT_OFFSET_MINUTES * MIN);
  const dayStart = Date.UTC(y, m, d);
  const weekStart = dayStart - ((npt.getUTCDay() + 6) % 7) * 86_400_000; // Monday
  const monthStart = Date.UTC(y, m, 1);
  return { today: toUtc(dayStart), week: toUtc(weekStart), month: toUtc(monthStart) };
}

type Range = "today" | "week" | "month";
const LABEL: Record<Range, string> = { today: "Today", week: "This week", month: "This month" };

export default function OrdersPage() {
  const [clicks, setClicks] = useState<OrderClick[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [range, setRange] = useState<Range>("today");
  const [error, setError] = useState<string | null>(null);
  const b = useMemo(() => boundaries(), []);

  useEffect(() => {
    const sb = createClient();
    const since = new Date(Math.min(b.week.getTime(), b.month.getTime())).toISOString();
    sb.from("order_clicks").select("*").gte("created_at", since).limit(10000).then(({ data, error }) => {
      if (error) setError(error.message); else setClicks(data as OrderClick[]);
    });
    sb.from("places").select("*").then(({ data }) => setPlaces((data as Place[]) ?? []));
    sb.from("areas").select("*").then(({ data }) => setAreas((data as Area[]) ?? []));
  }, [b]);

  const inRange = (r: Range) => clicks.filter((c) => new Date(c.created_at) >= b[r]);
  const rows = inRange(range);

  const count = (key: (c: OrderClick) => string) => {
    const m = new Map<string, { n: number; total: number }>();
    rows.forEach((c) => {
      const k = key(c);
      const cur = m.get(k) ?? { n: 0, total: 0 };
      cur.n += 1; cur.total += Number(c.items_total_npr ?? 0);
      m.set(k, cur);
    });
    return [...m.entries()].sort((a, z) => z[1].n - a[1].n);
  };
  const placeName = (id: string) => places.find((p) => p.id === id)?.name ?? "Unknown place";

  // Orders per hour of the day in Nepal time.
  const nptHour = (iso: string) => new Date(new Date(iso).getTime() + NPT_OFFSET_MINUTES * MIN).getUTCHours();
  const byHour = Array.from({ length: 24 }, (_, h) => rows.filter((c) => nptHour(c.created_at) === h).length);
  const maxHour = Math.max(1, ...byHour);
  const hourLabel = (h: number) => (h === 0 ? "12am" : h < 12 ? h + "am" : h === 12 ? "12pm" : h - 12 + "pm");

  const downloadCsv = () => {
    const cell = (v: string | number | null) => {
      let s = v === null ? "" : String(v);
      if (/^[=+@-]/.test(s)) s = "'" + s; // stop spreadsheets running a cell as a formula
      return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const areaName = (id: string | null) => areas.find((a) => a.id === id)?.name ?? "";
    const lines = [["Date (Nepal time)", "Time", "Service", "Place", "Items total (NPR)", "Area"].join(",")];
    [...rows].sort((a, z) => a.created_at.localeCompare(z.created_at)).forEach((c) => {
      const npt = new Date(new Date(c.created_at).getTime() + NPT_OFFSET_MINUTES * MIN).toISOString();
      lines.push([npt.slice(0, 10), npt.slice(11, 16), c.service, c.place_id ? placeName(c.place_id) : "", c.items_total_npr ?? "", areaName(c.area_id)].map(cell).join(","));
    });
    // The leading ﻿ lets Excel read the file as UTF-8.
    const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "orders-" + range + ".csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const byService = count((c) => c.service);
  const byPlace = count((c) => c.place_id ?? "").filter(([k]) => k);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-brand-blue">Order count</h1>
      <p className="text-sm text-slate-600">Counts WhatsApp orders sent from the website. Customer details are never stored.</p>
      <Notice error={error} />

      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(LABEL) as Range[]).map((r) => (
          <button key={r} aria-pressed={range === r} onClick={() => setRange(r)}
            className={`min-h-[64px] rounded-xl border p-2 text-center ${range === r ? "border-brand-blue bg-brand-blue text-white" : "border-slate-300"}`}>
            <span className="block text-2xl font-extrabold">{inRange(r).length}</span>
            <span className="block text-xs">{LABEL[r]}</span>
          </button>
        ))}
      </div>

      <Card>
        <h2 className="mb-2 font-bold">Busiest hours ({LABEL[range]})</h2>
        {rows.length === 0 ? <p className="text-slate-500">No orders yet.</p> : (
          <div role="img" aria-label={"Orders per hour: " + byHour.map((n, h) => hourLabel(h) + " " + n).filter((_, h) => byHour[h] > 0).join(", ")}>
            <div className="flex h-28 items-end gap-0.5" aria-hidden>
              {byHour.map((n, h) => (
                <div key={h} className="flex h-full flex-1 flex-col justify-end" title={hourLabel(h) + ": " + n}>
                  <div className={n === maxHour ? "rounded-t bg-brand-red" : "rounded-t bg-brand-blue"} style={{ height: (n / maxHour) * 100 + "%", minHeight: n ? 3 : 0 }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-500" aria-hidden>
              {[0, 6, 12, 18, 23].map((h) => <span key={h}>{hourLabel(h)}</span>)}
            </div>
            <p className="mt-2 text-sm text-slate-600">Busiest: <b>{hourLabel(byHour.indexOf(maxHour))}</b> ({maxHour} {maxHour === 1 ? "order" : "orders"})</p>
          </div>
        )}
      </Card>

      <button type="button" onClick={downloadCsv} disabled={rows.length === 0}
        className="min-h-[48px] w-full rounded-xl border border-brand-blue px-4 font-bold text-brand-blue disabled:opacity-50">
        Download {LABEL[range].toLowerCase()} as CSV
      </button>

      <Card>
        <h2 className="mb-2 font-bold">By service ({LABEL[range]})</h2>
        {byService.length === 0 && <p className="text-slate-500">No orders yet.</p>}
        <ul className="divide-y">
          {byService.map(([k, v]) => (
            <li key={k} className="flex justify-between py-2"><span className="capitalize">{k}</span><span><b>{v.n}</b> · {formatNPR(v.total)}</span></li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-2 font-bold">By place ({LABEL[range]})</h2>
        {byPlace.length === 0 && <p className="text-slate-500">No orders yet.</p>}
        <ul className="divide-y">
          {byPlace.map(([k, v]) => (
            <li key={k} className="flex justify-between py-2"><span>{placeName(k)}</span><span><b>{v.n}</b> · {formatNPR(v.total)}</span></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
