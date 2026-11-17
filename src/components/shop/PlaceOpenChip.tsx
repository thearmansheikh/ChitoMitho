"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { isOpenNow } from "@/lib/format";

/** Open or closed badge for a place that has its own hours. Renders nothing until the browser knows the time. */
export default function PlaceOpenChip({ opensAt, closesAt }: { opensAt: string | null; closesAt: string | null }) {
  const t = useTranslations("placeInfo");
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    if (!opensAt || !closesAt) return;
    const tick = () => setOpen(isOpenNow(opensAt.slice(0, 5), closesAt.slice(0, 5)));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [opensAt, closesAt]);
  if (open === null) return null;
  return (
    <span className={`absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${open ? "bg-green-50 text-green-900 ring-green-200" : "bg-red-50 text-red-800 ring-red-200"}`}>
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${open ? "bg-green-600" : "bg-brand-red"}`} />
      {open ? t("openNow") : t("closed")}
    </span>
  );
}
