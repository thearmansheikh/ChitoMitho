"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { isOpenNow } from "@/lib/format";
import { SITE } from "@/lib/config";

export default function OpenBadge() {
  const t = useTranslations("header");
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const tick = () => setOpen(isOpenNow(SITE.openTime, SITE.closeTime));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  if (open === null) return <span className="h-6 w-20" aria-hidden />;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${open ? "bg-green-100 text-green-800" : "bg-red-100 text-brand-red"}`}>
      <span className={`h-2 w-2 rounded-full ${open ? "bg-green-600" : "bg-brand-red"}`} />
      {open ? t("open") : t("closed")}
    </span>
  );
}
