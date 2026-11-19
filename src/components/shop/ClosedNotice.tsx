"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { pick } from "@/lib/names";
import { isOpenNow } from "@/lib/format";
import { openStatus } from "@/lib/openStatus";

/** Shows a clear message when orders are paused or the shop is closed. Browsing stays possible. */
export default function ClosedNotice({ openTime, closeTime, paused, pauseMessage, pauseMessageNe, tomorrowOpen = null, tomorrowClose = null }: {
  openTime: string; closeTime: string; paused: boolean; pauseMessage: string | null; pauseMessageNe?: string | null; tomorrowOpen?: string | null; tomorrowClose?: string | null;
}) {
  const t = useTranslations("home");
  const locale = useLocale();
  const [open, setOpen] = useState(() => isOpenNow(openTime, closeTime));
  useEffect(() => { setOpen(isOpenNow(openTime, closeTime)); }, [openTime, closeTime]);

  if (paused) {
    return <p role="status" className="rounded-xl bg-red-50 p-4 font-semibold text-brand-red">{pauseMessage ? pick(pauseMessage, pauseMessageNe, locale) : t("paused")}</p>;
  }
  if (!open) {
    const s = openStatus({ open: openTime, close: closeTime }, tomorrowOpen ? { open: tomorrowOpen, close: tomorrowClose ?? closeTime } : null);
    return (
      <p role="status" className="rounded-xl bg-yellow-50 p-4 font-semibold text-yellow-900">
        {s.open ? t("closedOpensToday", { time: closeTime.slice(0, 5) }) : t(s.opensTomorrow ? "closedOpensTomorrow" : "closedOpensToday", { time: s.opensAt })}
        <span className="mt-1 block text-sm font-normal">{t("closedOrderLater")}</span>
      </p>
    );
  }
  return null;
}
