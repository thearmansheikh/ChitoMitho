import en from "../../messages/en.json";
import ne from "../../messages/ne.json";
import { formatNPR } from "./format";
import { pick } from "./names";
import type { BasketLine, Extras } from "@/context/BasketContext";
import type { Payment } from "./details";

export type Lang = "en" | "ne";
const L = { en: en.wa, ne: ne.wa } as const;

/** Customer data as it appears in the message (area already turned into text). */
export interface Customer {
  name: string;
  phone: string;
  area: string;
  landmark: string;
  /** Optional GPS position the customer chose to share. */
  location?: { lat: number; lng: number } | null;
  payment: Payment;
  note: string;
}

export interface ParcelOrder {
  pickup: string;
  drop: string;
  item: string;
  size: "small" | "medium" | "large";
  receiverName: string;
  receiverPhone: string;
}

export interface AnythingOrder {
  need: string;
  buyFrom: string;
  budget: string;
}

/** Google Maps link that opens at the exact point (works on every phone and in WhatsApp). */
export function mapLink(p: { lat: number; lng: number }): string {
  return `https://www.google.com/maps?q=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
}

function customerBlock(lang: Lang, c: Customer): string[] {
  const t = L[lang];
  return [
    `${t.name}: ${c.name}`,
    `${t.phone}: ${c.phone}`,
    `${t.area}: ${c.area}`,
    `${t.landmark}: ${c.landmark}`,
    ...(c.location ? [`📍 ${t.location}: ${mapLink(c.location)}`] : []),
    `${t.payment}: ${t.payments[c.payment]}`,
    ...(c.note.trim() ? [`${t.note}: ${c.note.trim()}`] : []),
  ];
}

export function basketMessage(
  lang: Lang,
  o: { lines: BasketLine[]; extras: Extras; total: number; customer: Customer },
): string {
  const t = L[lang];
  const types = [...new Set(o.lines.map((l) => l.placeType))];
  if (types.length === 0) types.push("grocery"); // shopping list only
  const out: string[] = [
    t.header,
    `${t.orderType}: ${types.map((x) => t.services[x]).join(" + ")}`,
  ];

  const places = [...new Set(o.lines.map((l) => l.placeId))];
  for (const pid of places) {
    const ls = o.lines.filter((l) => l.placeId === pid);
    out.push("", `${t.from}: ${pick(ls[0].placeName, ls[0].placeNameNe, lang)}`);
    for (const l of ls) {
      out.push(`• ${l.qty} x ${pick(l.name, l.nameNe, lang)} (${formatNPR(l.price)}) = ${formatNPR(l.qty * l.price)}`);
      if (l.note.trim()) out.push(`   ↳ ${l.note.trim()}`);
    }
  }
  if (o.lines.length > 0) out.push("", `${t.itemsTotal}: ${formatNPR(o.total)}`);

  if (o.extras.shoppingList.trim()) out.push("", `${t.shoppingList}:`, o.extras.shoppingList.trim());

  const g = o.extras.gift;
  if (o.lines.some((l) => l.placeType === "gifts")) {
    const gl = [
      g.recipientName && `${t.giftTo}: ${g.recipientName}`,
      g.recipientPhone && `${t.giftPhone}: ${g.recipientPhone}`,
      g.message && `${t.giftCard}: ${g.message}`,
      (g.date || g.time) && `${t.giftWhen}: ${[g.date, g.time].filter(Boolean).join(" ")}`,
    ].filter(Boolean) as string[];
    if (gl.length) out.push("", ...gl);
  }

  out.push(t.deliveryTbc, "", ...customerBlock(lang, o.customer));
  return out.join("\n");
}

export function parcelMessage(lang: Lang, p: ParcelOrder, customer: Customer): string {
  const t = L[lang];
  return [
    t.header,
    `${t.orderType}: ${t.services.parcel}`,
    "",
    `${t.pickup}: ${p.pickup}`,
    `${t.drop}: ${p.drop}`,
    `${t.item}: ${p.item}`,
    `${t.size}: ${t.sizes[p.size]}`,
    `${t.receiver}: ${p.receiverName}`,
    `${t.receiverPhone}: ${p.receiverPhone}`,
    t.deliveryTbc,
    "",
    ...customerBlock(lang, customer),
  ].join("\n");
}

export function anythingMessage(lang: Lang, a: AnythingOrder, customer: Customer): string {
  const t = L[lang];
  return [
    t.header,
    `${t.orderType}: ${t.services.anything}`,
    "",
    `${t.need}: ${a.need}`,
    ...(a.buyFrom.trim() ? [`${t.buyFrom}: ${a.buyFrom.trim()}`] : []),
    ...(a.budget.trim() ? [`${t.budget}: ${a.budget.trim()}`] : []),
    t.deliveryTbc,
    "",
    ...customerBlock(lang, customer),
  ].join("\n");
}

export type BusinessType = "cafe" | "grocery" | "liquor" | "gifts" | "other";
export type Vehicle = "bike" | "scooter" | "bicycle" | "other";

export interface PartnerRequest {
  business: string;
  type: BusinessType;
  contactName: string;
  phone: string;
  area: string;
  offer: string;
}

export interface RiderApplication {
  name: string;
  phone: string;
  area: string;
  vehicle: Vehicle;
  hasLicense: boolean;
  availability: string;
}

export function partnerMessage(lang: Lang, p: PartnerRequest): string {
  const t = L[lang].partner;
  return [
    t.header,
    `${t.business}: ${p.business}`,
    `${t.type}: ${t.types[p.type]}`,
    `${t.contactName}: ${p.contactName}`,
    `${t.phone}: ${p.phone}`,
    `${t.area}: ${p.area}`,
    ...(p.offer.trim() ? [`${t.offer}: ${p.offer.trim()}`] : []),
    "",
    `✅ ${t.consent}`,
    t.menuPhotos,
  ].join("\n");
}

export function riderMessage(lang: Lang, r: RiderApplication): string {
  const t = L[lang].partner;
  return [
    t.riderHeader,
    `${t.riderName}: ${r.name}`,
    `${t.phone}: ${r.phone}`,
    `${t.area}: ${r.area}`,
    `${t.vehicle}: ${t.vehicles[r.vehicle]}`,
    `${t.license}: ${r.hasLicense ? t.yes : t.no}`,
    ...(r.availability.trim() ? [`${t.availability}: ${r.availability.trim()}`] : []),
  ].join("\n");
}

/** wa.me link for a Nepal number. Accepts "98XXXXXXXX", "+977 98…" or "97798…". */
export function whatsappUrl(number: string, text: string): string {
  let d = number.replace(/\D/g, "");
  if (d.startsWith("977") && d.length > 10) d = d.slice(3);
  return `https://wa.me/977${d}?text=${encodeURIComponent(text)}`;
}
