"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { anythingMessage } from "@/lib/whatsapp";
import type { Area } from "@/types/db";
import PageHeader from "@/components/ui/PageHeader";
import ServiceIcon from "@/components/ui/ServiceIcon";
import FormField from "@/components/ui/FormField";
import SendOrder, { type OrderConfig } from "./SendOrder";

const input =
  "w-full min-h-[48px] rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30";

const EXAMPLES = ["medicine", "charger", "cake", "gas", "documents", "groceryRun"] as const;
const MAX_BUDGET_DIGITS = 7;

export default function AnythingForm({ config, areas }: { config: OrderConfig; areas: Area[] }) {
  const t = useTranslations("anything");
  const o = useTranslations("order");
  const c = useTranslations("common");
  const [f, setF] = useState({ need: "", buyFrom: "", budget: "" });
  const [needError, setNeedError] = useState<string | undefined>();

  return (
    <div className="space-y-4">
      <PageHeader icon={<ServiceIcon name="anything" className="h-9 w-9" />} tone="ink" title={t("title")} subtitle={t("intro")} />
      <p className="text-xs text-slate-600">{c("requiredNote")}</p>

      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold">{t("examplesTitle")}</p>
          <ul className="flex flex-wrap gap-2">
            {EXAMPLES.map((k) => (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => { setF((s) => ({ ...s, need: s.need.trim() ? `${s.need.trim()}, ${t(`examples.${k}`)}` : t(`examples.${k}`) })); setNeedError(undefined); }}
                  className="min-h-[44px] rounded-full bg-indigo-50 px-4 text-sm font-semibold text-indigo-900 ring-1 ring-indigo-100 transition active:scale-95"
                >
                  + {t(`examples.${k}`)}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <FormField label={t("need")} required help={t("needHelp")} error={needError}>
          <textarea className={`${input} min-h-[110px]`} value={f.need} onChange={(e) => { setF({ ...f, need: e.target.value }); setNeedError(undefined); }} aria-invalid={!!needError} />
        </FormField>
        <p className="text-xs font-semibold text-slate-600">📷 {t("photoHint")}</p>

        <FormField label={`${t("buyFrom")} (${c("optional")})`} help={t("buyFromHelp")}>
          <input className={input} value={f.buyFrom} onChange={(e) => setF({ ...f, buyFrom: e.target.value })} />
        </FormField>

        <FormField label={`${t("budget")} (${c("optional")})`} help={t("budgetHelp")}>
          <span className="flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/30">
            <span aria-hidden className="pl-3 font-semibold text-slate-600">Rs.</span>
            <input
              className="min-h-[48px] w-full rounded-lg bg-transparent px-2 py-2 text-base focus:outline-none"
              inputMode="numeric" pattern="[0-9]*" autoComplete="off" aria-label={`${t("budget")} (Rs.)`} placeholder="500"
              value={f.budget}
              // Numbers only, so the message can show a clean "Rs. 500".
              onChange={(e) => setF({ ...f, budget: e.target.value.replace(/\D/g, "").slice(0, MAX_BUDGET_DIGITS) })}
            />
          </span>
        </FormField>
      </div>

      {needError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-brand-red">{o("checkFields")}</p>}

      <SendOrder
        service="anything" placeId={null} itemsTotal={null} config={config} areas={areas}
        validate={() => {
          if (f.need.trim()) return null;
          setNeedError(o("required"));
          return "";
        }}
        build={(customer, lang) => anythingMessage(lang, { need: f.need.trim(), buyFrom: f.buyFrom, budget: f.budget }, customer)}
      />
    </div>
  );
}
