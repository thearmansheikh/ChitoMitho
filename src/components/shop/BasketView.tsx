"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useBasket } from "@/context/BasketContext";
import { formatNPR } from "@/lib/format";
import { pick } from "@/lib/names";
import { basketMessage } from "@/lib/whatsapp";
import { checkPromo } from "@/lib/promo";
import type { Area, Offer, Service } from "@/types/db";
import SendOrder, { type OrderConfig } from "@/components/forms/SendOrder";
import PageHeader from "@/components/ui/PageHeader";
import ScooterArt from "@/components/ui/ScooterArt";
import ReorderCard from "./ReorderCard";
import PromoCode from "./PromoCode";

export default function BasketView({ config, areas, offers }: { config: OrderConfig; areas: Area[]; offers: Offer[] }) {
  const t = useTranslations("basket");
  const d = useTranslations("delivery");
  const locale = useLocale();
  const { lines, extras, total, hydrated, setQty, setNote, remove, clear, saveLastOrder, notice, setNotice } = useBasket();

  if (!hydrated) return null;

  const giftInBasket = lines.some((l) => l.placeType === "gifts");
  const hasGift = giftInBasket && Object.values(extras.gift).some(Boolean);
  const hasList = extras.shoppingList.trim().length > 0;

  if (lines.length === 0 && !hasList) {
    return (
      <div className="space-y-4 py-8 text-center">
        <div className="flex justify-center"><ScooterArt className="h-28 w-auto" /></div>
        <div className="text-left"><PageHeader icon="🧺" tone="blue" title={t("title")} /></div>
        <p className="text-slate-600">{t("empty")}</p>
        {notice && (
          <p role="status" className="mx-auto max-w-sm rounded-lg bg-yellow-50 p-3 text-left text-sm font-semibold text-yellow-900">{notice}</p>
        )}
        <Link href="/" onClick={() => setNotice(null)} className="inline-flex min-h-[52px] items-center rounded-xl bg-brand-blue px-6 font-bold text-white">{t("browse")}</Link>
        <div className="mx-auto max-w-sm text-left"><ReorderCard /></div>
      </div>
    );
  }

  // Group lines by place, keeping first-added order.
  const groups: { id: string; name: string; subtotal: number; lines: typeof lines }[] = [];
  for (const l of lines) {
    let g = groups.find((x) => x.id === l.placeId);
    if (!g) {
      g = { id: l.placeId, name: pick(l.placeName, l.placeNameNe, locale), subtotal: 0, lines: [] };
      groups.push(g);
    }
    g.lines.push(l);
    g.subtotal += l.qty * l.price;
  }

  // The order is counted under the place with the biggest share of the basket.
  const main = [...groups].sort((a, b) => b.subtotal - a.subtotal)[0];
  const mainLine = main ? main.lines[0] : null;
  const service: Service = mainLine ? mainLine.placeType : "grocery";

  const step = "flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-xl font-bold text-brand-blue";

  return (
    <div className="space-y-6">
      <PageHeader icon="🧺" tone="blue" title={t("title")} />
      {notice && (
        <p role="status" className="flex items-start justify-between gap-2 rounded-lg bg-yellow-50 p-3 text-sm font-semibold text-yellow-900">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label={t("dismiss")} className="-m-2 flex h-11 w-11 flex-none items-center justify-center text-lg">×</button>
        </p>
      )}

      {groups.map((g) => (
        <section key={g.id} className="space-y-2">
          <h2 className="text-lg font-bold">{g.name}</h2>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {g.lines.map((l) => {
              const name = pick(l.name, l.nameNe, locale);
              return (
                <li key={l.itemId} className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{name}</p>
                      <p className="text-sm text-slate-600">{formatNPR(l.price)} × {l.qty} = <b>{formatNPR(l.price * l.qty)}</b></p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" className={step} aria-label={`${t("decrease")}: ${name}`} onClick={() => setQty(l.itemId, l.qty - 1)}>−</button>
                      <span className="min-w-[2rem] text-center text-lg font-bold" aria-live="polite">{l.qty}</span>
                      <button type="button" className={step} aria-label={`${t("increase")}: ${name}`} onClick={() => setQty(l.itemId, l.qty + 1)}>+</button>
                    </div>
                  </div>
                  <input value={l.note} onChange={(e) => setNote(l.itemId, e.target.value)} placeholder={t("note")} aria-label={`${t("note")}: ${name}`}
                    className="w-full min-h-[44px] rounded-lg border border-slate-300 px-3 text-base focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/30" />
                  <button type="button" onClick={() => remove(l.itemId)} className="min-h-[44px] text-sm font-semibold text-brand-red">{t("remove")}</button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {hasList && (
        <section className="rounded-xl border border-slate-200 p-4">
          <h2 className="font-bold">{t("shoppingList")}</h2>
          <p className="mt-1 whitespace-pre-line text-slate-700">{extras.shoppingList}</p>
          <Link href="/groceries" aria-label={t("shoppingList")} className="mt-2 inline-block min-h-[44px] py-2 text-sm font-semibold text-brand-blue">✎</Link>
        </section>
      )}

      {hasGift && (
        <section className="rounded-xl border border-slate-200 p-4 text-sm">
          <h2 className="font-bold">{t("giftDetails")}</h2>
          <p>{extras.gift.recipientName} {extras.gift.recipientPhone}</p>
          {extras.gift.message && <p className="italic">“{extras.gift.message}”</p>}
          <p>{extras.gift.date} {extras.gift.time}</p>
          <Link href="/gifts" aria-label={t("giftDetails")} className="inline-block min-h-[44px] py-2 font-semibold text-brand-blue">✎</Link>
        </section>
      )}

      <PromoCode offers={offers} />

      <section className="space-y-2 rounded-xl bg-slate-50 p-4">
        <p className="flex items-center justify-between text-lg font-bold">
          <span>{t("itemsTotal")}</span><span>{formatNPR(total)}</span>
        </p>
        <p className="text-sm text-slate-600">{d("note")}</p>
      </section>

      <div className="space-y-2">
        <SendOrder
          service={service}
          placeId={main?.id ?? null}
          itemsTotal={lines.length ? total : null}
          config={config}
          areas={areas}
          onDone={clear}
          onSent={() => saveLastOrder({ lines, shoppingList: extras.shoppingList, total })}
          validate={() =>
            giftInBasket && (!extras.gift.recipientName.trim() || !extras.gift.recipientPhone.trim()) ? t("giftNeeds") : null
          }
          allowSchedule={!giftInBasket}
          build={(customer, lang) => {
            // Only a code that is valid for this basket goes into the message.
            const promoOk = extras.promo && checkPromo(offers, extras.promo, total).ok;
            return basketMessage(lang, { lines, extras: { ...extras, promo: promoOk ? extras.promo : "" }, total, customer });
          }}
        />
        <button type="button" onClick={clear} className="min-h-[44px] w-full text-sm font-semibold text-brand-red">{t("clear")}</button>
      </div>
    </div>
  );
}
