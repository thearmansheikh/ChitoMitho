"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { isOpenNow } from "@/lib/format";
import ShareButton from "./ShareButton";

/** Address, today's open or closed state, opening hours, a map button and a share button for one place. */
export default function PlaceInfo({ name, address, mapsUrl, opensAt, closesAt, shopOpen, shopClose, paused }: {
  name: string;
  address: string | null;
  mapsUrl: string | null;
  opensAt: string | null;
  closesAt: string | null;
  shopOpen: string;
  shopClose: string;
  paused: boolean;
}) {
  const t = useTranslations("placeInfo");
  // The place's own hours win; otherwise it keeps the shop's hours.
  const open = (opensAt ?? shopOpen).slice(0, 5);
  const close = (closesAt ?? shopClose).slice(0, 5);
  const ownHours = opensAt !== null && closesAt !== null;
  const [isOpen, setIsOpen] = useState(() => isOpenNow(open, close));

  useEffect(() => {
    const tick = () => setIsOpen(isOpenNow(open, close));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [open, close]);

  // Only real web links become a button.
  const safeMap = mapsUrl && /^https?:\/\//i.test(mapsUrl) ? mapsUrl : null;
  const live = isOpen && !paused;

  return (
    <section aria-label={name} className="space-y-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-slate-200/70">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${live ? "bg-green-50 text-green-900 ring-green-200" : "bg-red-50 text-red-800 ring-red-200"}`}>
          <span aria-hidden className={`h-2 w-2 rounded-full ${live ? "bg-green-600" : "bg-brand-red"}`} />
          {live ? t("openNow") : t("closed")}
        </span>
        <span className="text-sm text-slate-600">
          {/* A place with its own hours shows them; otherwise say when it next opens or closes. */}
          {ownHours ? `${open} – ${close}` : live ? t("until", { time: close }) : t("opensAt", { time: open })}
        </span>
      </div>
      {address && (
        <p className="flex items-start gap-2 text-sm text-slate-700">
          <span aria-hidden>📍</span>
          <span><span className="sr-only">{t("address")}: </span>{address}</span>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {safeMap && (
          <a href={safeMap} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-blue px-4 text-sm font-bold text-white shadow-pop transition active:scale-95">
            <span aria-hidden>🗺️</span> {t("openInMaps")}
          </a>
        )}
        <ShareButton title={name} />
      </div>
    </section>
  );
}
