"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { SheetExtra } from "./DetailsSheet";
import { isOpenNow } from "@/lib/format";
import { loadDetails, saveDetails, type Details } from "@/lib/details";
import { pick } from "@/lib/names";
import { whatsappUrl, type Customer, type Lang } from "@/lib/whatsapp";
import type { Area, Service } from "@/types/db";
// The sheet is only needed after the customer taps the order button.
const DetailsSheet = dynamic(() => import("./DetailsSheet"));

export interface OrderConfig {
  openTime: string;
  closeTime: string;
  paused: boolean;
  pauseMessage: string | null;
  pauseMessageNe?: string | null;
  whatsapp: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Count the order (never the customer). Failures are ignored so ordering is never blocked. */
async function logOrderClick(row: { service: Service; place_id: string | null; items_total_npr: number | null; area_id: string | null }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  try {
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().from("order_clicks").insert({
      service: row.service,
      place_id: row.place_id && UUID.test(row.place_id) ? row.place_id : null,
      items_total_npr: row.items_total_npr,
      area_id: row.area_id && UUID.test(row.area_id) ? row.area_id : null,
    });
  } catch {
    /* ignore */
  }
}

export default function SendOrder({ service, placeId, itemsTotal, build, validate, config, areas, onDone, onSent, label, allowSchedule = true }: {
  service: Service;
  placeId: string | null;
  itemsTotal: number | null;
  build: (customer: Customer, lang: Lang) => string;
  /** Return an error message if the form is incomplete; shown instead of opening the sheet. */
  validate?: () => string | null;
  config: OrderConfig;
  areas: Area[];
  onDone?: () => void;
  /** Called once the order has been handed to WhatsApp (used to remember it for "Order again"). */
  onSent?: () => void;
  /** Offer "as soon as possible / later" in the details sheet. Off for gifts, which pick their own date. */
  allowSchedule?: boolean;
  label?: string;
}) {
  const t = useTranslations("order");
  const h = useTranslations("home");
  const b = useTranslations("basket");
  const locale = useLocale() as Lang;
  const router = useRouter();

  const [sheet, setSheet] = useState(false);
  const [saved, setSaved] = useState<Details | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(() => isOpenNow(config.openTime, config.closeTime));

  useEffect(() => {
    const tick = () => setOpen(isOpenNow(config.openTime, config.closeTime));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [config.openTime, config.closeTime]);

  const blocked = config.paused ? (config.pauseMessage ? pick(config.pauseMessage, config.pauseMessageNe, locale) : h("paused")) : !open ? h("closedNow") : null;

  function start() {
    setError(null);
    if (blocked) return;
    const v = validate?.();
    if (v) return setError(v);
    setSaved(loadDetails());
    setSheet(true);
  }

  /** The exact message the customer's WhatsApp will open with, built the same way for the preview and the send. */
  function makeText(d: Details, note: string, extra: SheetExtra) {
    const area = areas.find((a) => a.id === d.areaId);
    const areaText = area ? `${t(`groups.${area.area_group}`)} – ${pick(area.name, area.name_ne, locale)}` : d.areaOther;
    const text = build(
      { name: d.name, phone: d.phone, area: areaText, landmark: d.landmark, location: extra.location, deliverAt: extra.deliverAt, payment: d.payment, note },
      locale,
    );
    return { text, area };
  }

  async function confirm(d: Details, note: string, extra: SheetExtra) {
    // Re-check at the moment of sending: the page may have been open since before closing time.
    if (config.paused || !isOpenNow(config.openTime, config.closeTime)) {
      setSheet(false);
      setOpen(isOpenNow(config.openTime, config.closeTime));
      return;
    }
    setBusy(true);
    saveDetails(d);

    const { text, area } = makeText(d, note, extra);
    const url = whatsappUrl(config.whatsapp, text);

    // Give the count a moment to send, but never make the customer wait long.
    await Promise.race([
      logOrderClick({ service, place_id: placeId, items_total_npr: itemsTotal, area_id: area?.id ?? null }),
      new Promise((r) => setTimeout(r, 800)),
    ]);

    setSentUrl(url);
    setSheet(false);
    setBusy(false);
    onSent?.();
    // A new tab works on desktop; if the browser blocks it (common on iPhone), go in this tab.
    const w = window.open(url, "_blank", "noopener");
    if (!w) window.location.href = url;
  }

  if (sentUrl) {
    return (
      <div role="dialog" aria-modal="true" aria-labelledby="sent-title" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-white p-6 sm:items-center">
        <div className="w-full max-w-sm space-y-4 text-center">
          <p className="text-6xl" aria-hidden>✅</p>
          <h2 id="sent-title" className="text-2xl font-extrabold text-brand-blue">{t("sentTitle")}</h2>
          <p className="text-slate-700">{t("sentBody")}</p>
          <div className="rounded-2xl bg-slate-50 p-4 text-left">
            <p className="mb-2 font-bold">{t("nextTitle")}</p>
            <ol className="space-y-2 text-sm text-slate-700">
              {(["next1", "next2", "next3"] as const).map((k, i) => (
                <li key={k} className="flex gap-3">
                  <span aria-hidden className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">{i + 1}</span>
                  <span>{t(k)}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-slate-500">{t("hoursLine", { open: config.openTime.slice(0, 5), close: config.closeTime.slice(0, 5) })}</p>
            <a href="/help" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-blue underline">{t("helpLink")}</a>
          </div>
          <a href={sentUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-[56px] w-full items-center justify-center rounded-xl bg-green-700 text-lg font-bold text-white">
            💬 {t("sentAgain")}
          </a>
          <button type="button" className="min-h-[52px] w-full rounded-xl border border-slate-300 font-bold"
            onClick={() => { onDone?.(); router.push("/"); }}>
            {t("sentDone")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button type="button" onClick={start} disabled={!!blocked}
        className="min-h-[56px] w-full rounded-xl bg-green-700 text-lg font-bold text-white disabled:opacity-50">
        💬 {label ?? b("orderOnWhatsapp")}
      </button>
      {blocked && <p role="status" className="mt-2 rounded-lg bg-yellow-50 p-3 text-sm font-semibold text-yellow-900">{blocked}</p>}
      {error && <p role="alert" className="mt-2 rounded-lg bg-red-50 p-3 text-sm font-semibold text-brand-red">{error}</p>}
      <DetailsSheet
        open={sheet} onClose={() => setSheet(false)} onConfirm={confirm} areas={areas} initial={saved} busy={busy}
        openTime={config.openTime} closeTime={config.closeTime} allowSchedule={allowSchedule}
        preview={(d, note, extra) => makeText(d, note, extra).text}
      />
    </>
  );
}
