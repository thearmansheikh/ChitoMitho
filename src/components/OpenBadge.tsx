"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { isOpenNow } from "@/lib/format";
import { openStatus } from "@/lib/openStatus";

export default function OpenBadge({ openTime, closeTime, paused, tomorrowOpen = null, tomorrowClose = null }: { openTime: string; closeTime: string; paused: boolean; tomorrowOpen?: string | null; tomorrowClose?: string | null }) {
  const t = useTranslations("header");
  const [open, setOpen] = useState<boolean>(() => isOpenNow(openTime, closeTime));

  useEffect(() => {
    const tick = () => setOpen(isOpenNow(openTime, closeTime));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [openTime, closeTime]);

  const isOpen = open && !paused;
  // When closed for the day or the hour, say when it opens again (not while orders are paused for a holiday).
  const status = openStatus({ open: openTime, close: closeTime }, tomorrowOpen ? { open: tomorrowOpen, close: tomorrowClose ?? closeTime } : null);
  const opensAt = !isOpen && !paused && !status.open ? status.opensAt : null;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${isOpen ? "bg-green-50 text-green-900 ring-green-200" : "bg-red-50 text-red-800 ring-red-200"}`}>
      <span aria-hidden className={`h-2 w-2 rounded-full ${isOpen ? "bg-green-600 motion-safe:animate-pulse-dot" : "bg-brand-red"}`} />
      {isOpen ? t("open") : opensAt ? (
        <>
          {t("closed")}
          {/* Shown on phones from 430px and on wide screens; hidden where the header is crowded. Always read out. */}
          <span aria-hidden className="hidden whitespace-nowrap min-[430px]:inline lg:max-xl:hidden"> · {t("opensAt", { time: opensAt })}</span>
          <span className="sr-only">. {t("opensAt", { time: opensAt })}</span>
        </>
      ) : t("closed")}
    </span>
  );
}
