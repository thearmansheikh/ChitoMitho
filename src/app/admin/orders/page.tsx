"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NPT_OFFSET_MINUTES, formatNPR } from "@/lib/format";
import { Card, Notice } from "@/components/admin/ui";
import type { OrderClick, Place } from "@/types/db";

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
