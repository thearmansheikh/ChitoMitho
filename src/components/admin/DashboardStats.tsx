"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NPT_OFFSET_MINUTES } from "@/lib/format";
import { Card } from "@/components/admin/ui";

const MIN = 60_000;

type Stats = { today: number; week: number; places: number; items: number; soldOut: number; paused: boolean; offers: number };

export default function DashboardStats() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient();
    const npt = new Date(Date.now() + NPT_OFFSET_MINUTES * MIN);
    const dayStart = Date.UTC(npt.getUTCFullYear(), npt.getUTCMonth(), npt.getUTCDate());
    const weekStart = dayStart - ((npt.getUTCDay() + 6) % 7) * 86_400_000;
    const iso = (ms: number) => new Date(ms - NPT_OFFSET_MINUTES * MIN).toISOString();
    const head = { count: "exact", head: true } as const;
    (async () => {
      const [t, w, p, i, so, st, o] = await Promise.all([
        sb.from("order_clicks").select("id", head).gte("created_at", iso(dayStart)),
        sb.from("order_clicks").select("id", head).gte("created_at", iso(weekStart)),
        sb.from("places").select("id", head).eq("is_active", true),
        sb.from("items").select("id", head),
        sb.from("items").select("id", head).eq("is_available", false),
        sb.from("settings").select("orders_paused").eq("id", 1).maybeSingle(),
        sb.from("offers").select("id", head).eq("is_active", true),
      ]);
      const bad = [t, w, p, i, so, st, o].find((r) => r.error);
      if (bad?.error) return setErr(bad.error.message);
      setS({
        today: t.count ?? 0, week: w.count ?? 0, places: p.count ?? 0, items: i.count ?? 0,
        soldOut: so.count ?? 0, paused: !!st.data?.orders_paused, offers: o.count ?? 0,
      });
    })();
  }, []);

  if (err) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">Could not load the summary: {err}</p>;

  const tiles: [string, string | number, string, string][] = s
    ? [
        ["Orders today", s.today, "/admin/orders", "WhatsApp orders sent"],
        ["Orders this week", s.week, "/admin/orders", "Since Monday"],
        ["Active places", s.places, "/admin/places", "Shown on the site"],
        ["Menu items", s.items, "/admin/items", `${s.soldOut} sold out`],
        ["Live offers", s.offers, "/admin/offers", "Active deals"],
        ["Orders", s.paused ? "Paused" : "Open", "/admin/settings", s.paused ? "Customers cannot send orders" : "Customers can order"],
      ]
    : [];

  return (
    <section aria-label="Summary" className="space-y-3">
      {s?.paused && (
        <p className="rounded-lg bg-yellow-50 p-3 text-sm font-semibold text-yellow-900">
          Orders are paused. <Link href="/admin/settings" className="underline">Turn them back on</Link>
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {s
          ? tiles.map(([label, value, href, sub]) => (
              <Link key={label} href={href}>
                <Card className="hover:border-brand-blue">
                  <p className="text-xs font-semibold text-slate-500">{label}</p>
                  <p className="text-2xl font-extrabold text-brand-blue">{value}</p>
                  <p className="text-xs text-slate-600">{sub}</p>
                </Card>
              </Link>
            ))
          : Array.from({ length: 6 }, (_, k) => <div key={k} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
      </div>
    </section>
  );
}
