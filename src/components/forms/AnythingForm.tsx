"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { anythingMessage } from "@/lib/whatsapp";
import type { Area } from "@/types/db";
import PageHeader from "@/components/ui/PageHeader";
import ServiceIcon from "@/components/ui/ServiceIcon";
import SendOrder, { type OrderConfig } from "./SendOrder";

const input =
  "w-full min-h-[48px] rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30";

const EXAMPLES = ["medicine", "charger", "cake", "gas", "documents", "groceryRun"] as const;

export default function AnythingForm({ config, areas }: { config: OrderConfig; areas: Area[] }) {
  const t = useTranslations("anything");
  const o = useTranslations("order");
  const c = useTranslations("common");
  const [f, setF] = useState({ need: "", buyFrom: "", budget: "" });

  return (
    <div className="space-y-4">
      <PageHeader icon={<ServiceIcon name="anything" className="h-9 w-9" />} tone="ink" title={t("title")} subtitle={t("intro")} />

      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold">{t("examplesTitle")}</p>
          <ul className="flex flex-wrap gap-2">
            {EXAMPLES.map((k) => (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => setF((s) => ({ ...s, need: s.need.trim() ? `${s.need.trim()}, ${t(`examples.${k}`)}` : t(`examples.${k}`) }))}
                  className="min-h-[44px] rounded-full bg-indigo-50 px-4 text-sm font-semibold text-indigo-900 ring-1 ring-indigo-100 transition active:scale-95"
                >
                  + {t(`examples.${k}`)}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("need")}</span>
          <textarea className={`${input} min-h-[110px]`} value={f.need} onChange={(e) => setF({ ...f, need: e.target.value })} />
          <span className="block text-xs text-slate-500">{t("needHelp")}</span>
          <span className="block text-xs font-semibold text-slate-600">📷 {t("photoHint")}</span>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("buyFrom")} ({c("optional")})</span>
          <input className={input} value={f.buyFrom} onChange={(e) => setF({ ...f, buyFrom: e.target.value })} />
          <span className="block text-xs text-slate-500">{t("buyFromHelp")}</span>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("budget")} ({c("optional")})</span>
          <input className={input} inputMode="numeric" placeholder="Rs." value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} />
          <span className="block text-xs text-slate-500">{t("budgetHelp")}</span>
        </label>
      </div>

      <SendOrder
        service="anything" placeId={null} itemsTotal={null} config={config} areas={areas}
        validate={() => (f.need.trim() ? null : o("required"))}
        build={(customer, lang) => anythingMessage(lang, { need: f.need.trim(), buyFrom: f.buyFrom, budget: f.budget }, customer)}
      />
    </div>
  );
}
