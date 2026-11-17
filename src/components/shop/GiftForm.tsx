"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useBasket } from "@/context/BasketContext";
import { giftIssues } from "@/lib/gift";
import { nepalDates } from "@/lib/format";
import SectionTitle from "@/components/ui/SectionTitle";

const input =
  "w-full min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30";

const OCCASIONS = ["birthday", "anniversary", "mothersday", "thankyou", "getwell", "justbecause"] as const;
const MAX_CARD = 200;

/** Who the gift is for, what the card says, and when it should arrive. Checked against opening hours. */
export default function GiftForm({ openTime, closeTime }: { openTime: string; closeTime: string }) {
  const t = useTranslations("gifts");
  const { extras, setGift } = useBasket();
  const g = extras.gift;

  // Today in Nepal, worked out on the phone after loading so the server and phone never disagree.
  const [today, setToday] = useState("");
  useEffect(() => { setToday(nepalDates().today); }, []);

  const open = openTime.slice(0, 5);
  const close = closeTime.slice(0, 5);
  const issues = giftIssues(g, open, close);
  // Name and phone are checked when the order is sent; date and time are checked live because they have limits.
  const dateIssue = issues.includes("datePast") ? t("issue.datePast") : issues.includes("dateNeeded") ? t("issue.dateNeeded") : null;
  const timeIssue = issues.includes("timeOutside") ? t("issue.timeOutside", { open, close }) : issues.includes("timeSoon") ? t("issue.timeSoon") : null;

  const ideas = g.occasion ? (t.raw(`ideas.${g.occasion}`) as string[]) : [];

  return (
    <section aria-labelledby="gift-h" className="space-y-5 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/70">
      <SectionTitle id="gift-h">{t("detailsTitle")}</SectionTitle>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">{t("occasion")}</legend>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => {
            const on = g.occasion === o;
            return (
              <button
                key={o} type="button" aria-pressed={on} onClick={() => setGift({ occasion: on ? "" : o })}
                className={`min-h-[44px] rounded-full px-4 text-sm font-semibold ring-1 transition active:scale-95 ${on ? "bg-rose-500 text-white ring-rose-500" : "bg-white text-slate-700 ring-slate-300"}`}
              >
                {t(`occasions.${o}`)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("recipientName")}</span>
          <input className={input} value={g.recipientName} onChange={(e) => setGift({ recipientName: e.target.value })} autoComplete="off" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("recipientPhone")}</span>
          <input className={input} type="tel" inputMode="numeric" placeholder="98XXXXXXXX" value={g.recipientPhone} onChange={(e) => setGift({ recipientPhone: e.target.value })} />
        </label>
      </div>

      <div className="space-y-2">
        <label htmlFor="gift-card" className="block text-sm font-semibold">{t("message")}</label>
        {ideas.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500">{t("ideasHint")}</p>
            <ul className="flex flex-wrap gap-2">
              {ideas.map((idea) => (
                <li key={idea}>
                  <button type="button" onClick={() => setGift({ message: idea })}
                    className="min-h-[44px] rounded-xl bg-rose-50 px-3 py-1.5 text-left text-sm text-rose-900 ring-1 ring-rose-100 transition active:scale-95">
                    {idea}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <textarea id="gift-card" className={`${input} min-h-[96px]`} maxLength={MAX_CARD} value={g.message} onChange={(e) => setGift({ message: e.target.value })} />
        <p className="text-right text-xs text-slate-500" aria-live="polite">{g.message.length} / {MAX_CARD}</p>
      </div>

      {(g.message.trim() || g.recipientName.trim()) && (
        <figure aria-label={t("preview")} className="mx-auto max-w-sm -rotate-1 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-card">
          <figcaption className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-700">{t("preview")}</figcaption>
          {g.recipientName.trim() && <p className="font-semibold text-slate-800">{t("to", { name: g.recipientName.trim() })}</p>}
          {g.message.trim() && <p className="mt-1 whitespace-pre-line font-serif text-lg italic leading-snug text-slate-800">“{g.message.trim()}”</p>}
        </figure>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("date")}</span>
          <input className={input} type="date" min={today || undefined} value={g.date} onChange={(e) => setGift({ date: e.target.value })} aria-invalid={!!dateIssue} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("time")}</span>
          <input className={input} type="time" min={open} max={close} value={g.time} onChange={(e) => setGift({ time: e.target.value })} aria-invalid={!!timeIssue} />
        </label>
      </div>
      <p className="-mt-3 text-xs text-slate-500">{t("whenHelp", { open, close })}</p>
      {(dateIssue || timeIssue) && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-brand-red">{dateIssue ?? timeIssue}</p>
      )}
    </section>
  );
}
