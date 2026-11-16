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
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isOpen ? "bg-green-100 text-green-900" : "bg-red-100 text-red-800"}`}>
      <span className={`h-2 w-2 rounded-full ${isOpen ? "bg-green-700" : "bg-brand-red"}`} />
      {isOpen ? t("open") : t("closed")}
    </span>
  );
}
