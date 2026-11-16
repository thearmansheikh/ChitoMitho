"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { isOpenNow } from "@/lib/format";

/** Shows a clear message when orders are paused or the shop is closed. Browsing stays possible. */
export default function ClosedNotice({ openTime, closeTime, paused, pauseMessage }: {
  openTime: string; closeTime: string; paused: boolean; pauseMessage: string | null;
}) {
  const t = useTranslations("home");
  const [open, setOpen] = useState(() => isOpenNow(openTime, closeTime));
  useEffect(() => { setOpen(isOpenNow(openTime, closeTime)); }, [openTime, closeTime]);

  if (paused) {
    return <p role="status" className="rounded-xl bg-red-50 p-4 font-semibold text-brand-red">{pauseMessage || t("paused")}</p>;
  }
  if (!open) {
    return <p role="status" className="rounded-xl bg-yellow-50 p-4 font-semibold text-yellow-900">{t("closedNow")}</p>;
  }
  return null;
}
