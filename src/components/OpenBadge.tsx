"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { isOpenNow } from "@/lib/format";

export default function OpenBadge({ openTime, closeTime, paused }: { openTime: string; closeTime: string; paused: boolean }) {
  const t = useTranslations("header");
  const [open, setOpen] = useState<boolean>(() => isOpenNow(openTime, closeTime));

  useEffect(() => {
    const tick = () => setOpen(isOpenNow(openTime, closeTime));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [openTime, closeTime]);

  const isOpen = open && !paused;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${isOpen ? "bg-green-50 text-green-900 ring-green-200" : "bg-red-50 text-red-800 ring-red-200"}`}>
      <span aria-hidden className={`h-2 w-2 rounded-full ${isOpen ? "bg-green-600 motion-safe:animate-pulse-dot" : "bg-brand-red"}`} />
      {isOpen ? t("open") : t("closed")}
    </span>
  );
}
