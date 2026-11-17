"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useBasket, type BasketLine } from "@/context/BasketContext";
import { formatNPR } from "@/lib/format";
import { pick } from "@/lib/names";

interface Status {
  id: string;
  price_npr: number;
  is_available: boolean;
}

/** "Order again": repeats the last order sent from this phone, using today's prices and availability. */
export default function ReorderCard() {
  const t = useTranslations("reorder");
  const locale = useLocale();
  const router = useRouter();
  const { lastOrder, hydrated, loadIntoBasket, setNotice } = useBasket();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!hydrated || !lastOrder) return null;
  const order = lastOrder;

  const shown = order.lines.slice(0, 3);
  const more = order.lines.length - shown.length;
  const places = [...new Set(order.lines.map((l) => pick(l.placeName, l.placeNameNe, locale)))];
  const date = order.savedAt
    ? new Date(order.savedAt).toLocaleDateString(locale === "ne" ? "ne-NP" : "en-GB", { day: "numeric", month: "short" })
    : "";

  async function reorder() {
    setBusy(true);
    setFailed(false);
    try {
      let lines: BasketLine[] = order.lines;
      let skipped = 0;
      let repriced = 0;
      if (lines.length > 0) {
        const res = await fetch("/api/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: lines.map((l) => l.itemId) }),
        });
        if (!res.ok) throw new Error("lookup failed");
        const { items } = (await res.json()) as { items: Status[] };
        const byId = new Map(items.map((i) => [i.id, i]));
        const next: BasketLine[] = [];
        for (const l of lines) {
          const cur = byId.get(l.itemId);
          if (!cur || !cur.is_available) { skipped += 1; continue; }
          const price = Number(cur.price_npr);
          if (price !== l.price) repriced += 1;
          next.push({ ...l, price });
        }
        lines = next;
      }
      loadIntoBasket(lines, order.shoppingList);
      const notes: string[] = [];
      if (skipped > 0) notes.push(t("skipped", { count: skipped }));
      if (repriced > 0) notes.push(t("repriced"));
      setNotice(notes.length ? notes.join(" ") : null);
      router.push("/basket");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label={t("title")} className="space-y-3 rounded-2xl border border-brand-blue/30 bg-blue-50 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-extrabold text-brand-blue">🔁 {t("title")}</h2>
        {date && <span className="text-xs text-slate-600">{date}</span>}
      </div>
      <ul className="space-y-0.5 text-sm text-slate-800">
        {shown.map((l) => (
          <li key={l.itemId}>{l.qty} × {pick(l.name, l.nameNe, locale)}</li>
        ))}
        {more > 0 && <li className="text-slate-600">{t("more", { count: more })}</li>}
        {order.shoppingList.trim() && <li className="text-slate-600">📝 {t("withList")}</li>}
      </ul>
      {places.length > 0 && <p className="text-xs text-slate-600">{places.join(", ")}</p>}
      {order.total > 0 && <p className="text-sm font-semibold">{t("lastTotal", { amount: formatNPR(order.total) })}</p>}
      <button type="button" onClick={reorder} disabled={busy}
        className="min-h-[52px] w-full rounded-xl bg-brand-blue font-bold text-white disabled:opacity-60">
        {busy ? t("checking") : t("button")}
      </button>
      <p className="text-xs text-slate-600">{t("note")}</p>
      {failed && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-brand-red">{t("failed")}</p>}
    </section>
  );
}
