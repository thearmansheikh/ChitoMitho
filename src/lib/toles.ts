"use client";

import { useEffect, useState } from "react";
import type { Tole } from "@/types/db";

let cache: Promise<Tole[]> | null = null;

/** The suggestions are public data. Fetched once per visit, and only when the details form opens. */
function fetchToles(): Promise<Tole[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return Promise.resolve([]);
  return fetch(`${url}/rest/v1/toles?select=id,name,name_ne,area_id,is_active&is_active=eq.true&order=name.asc&limit=2000`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
    .then((r) => (r.ok ? (r.json() as Promise<Tole[]>) : []))
    // No suggestions (table missing, offline...) never blocks an order: the customer just types the tole.
    .catch(() => []);
}

/** Tole suggestions for the address form. Empty until loaded, and empty if there are none. */
export function useToles(enabled: boolean): Tole[] {
  const [toles, setToles] = useState<Tole[]>([]);
  useEffect(() => {
    if (!enabled) return;
    cache ??= fetchToles();
    let live = true;
    cache.then((t) => { if (live) setToles(t); });
    return () => { live = false; };
  }, [enabled]);
  return toles;
}
