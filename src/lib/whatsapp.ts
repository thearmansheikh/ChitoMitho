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
  /** Tole or street, house or gate number and a second phone number are optional extras for the rider. */
  /** The delivery charge starts from this amount (from Settings). */
  deliveryFrom?: number | null;
  /** The chosen area has a fixed delivery charge. */
  deliveryFixed?: { area: string; amount: number } | null;
  /** False when the order has its own date and time (gifts), so no "Delivery:" line is written. Default true. */
  scheduled?: boolean;
  tole?: string;
  house?: string;
  phone2?: string;
  landmark: string;
  /** Optional GPS position the customer chose to share. */
  location?: { lat: number; lng: number } | null;
  /** Set when the customer wants delivery later instead of as soon as possible. */
  deliverAt?: { day: "today" | "tomorrow"; time: string } | null;
  payment: Payment;
  note: string;
}

export interface ParcelOrder {
  pickup: string;
  /** Optional GPS pins the customer chose to share for each end. */
  pickupPin?: { lat: number; lng: number } | null;
  dropPin?: { lat: number; lng: number } | null;
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

/**
 * Who, where, how to pay, when, and anything extra. Order: name, phone, address, payment, delivery time,
 * promo code (basket orders only), map location, note. Lines that are empty are left out.
 */
function customerBlock(lang: Lang, c: Customer, promo = "", kind: "order" | "parcel" = "order"): string[] {
  const t = L[lang];
  const parcel = kind === "parcel";
  const when = c.deliverAt ? `${t.later} – ${t[c.deliverAt.day]} ${c.deliverAt.time}` : t.asap;
  return [
    `${parcel ? t.senderName : t.name}: ${c.name}`,
    `${parcel ? t.senderPhone : t.phone}: ${c.phone}`,
    ...(c.phone2 ? [`${t.phone2}: ${c.phone2}`] : []),
    `${t.area}: ${c.area}`,
    ...(c.tole ? [`${t.tole}: ${c.tole}`] : []),
    ...(c.house ? [`${t.house}: ${c.house}`] : []),
    ...(c.landmark ? [`${t.landmark}: ${c.landmark}`] : []),
    `${t.payment}: ${t.payments[c.payment]}`,
    ...(c.scheduled === false ? [] : [`${parcel ? t.pickupTime : t.delivery}: ${when}`]),
    ...(promo.trim() ? [`🎟️ ${t.promo}: ${promo.trim().toUpperCase()}`] : []),
    ...(c.location ? [`📍 ${t.location}: ${mapLink(c.location)}`] : []),
    ...(c.note.trim() ? [`${t.note}: ${c.note.trim()}`] : []),
  ];
}

/** The line under the order that tells the team what the customer was told about the delivery charge. */
function deliveryLine(lang: Lang, c: { deliveryFrom?: number | null; deliveryFixed?: { area: string; amount: number } | null }): string {
  const t = L[lang];
  if (c.deliveryFixed) return t.deliveryFixed.replace("{area}", c.deliveryFixed.area).replace("{amount}", formatNPR(c.deliveryFixed.amount));
  return c.deliveryFrom != null ? t.deliveryFrom.replace("{amount}", formatNPR(c.deliveryFrom)) : t.deliveryTbc;
}

/** WhatsApp handles far more, but a short message is easier to read and to check before sending. */
export const MAX_MESSAGE_CHARS = 1500;

export function basketMessage(
  lang: Lang,
  o: { lines: BasketLine[]; extras: Extras; total: number; customer: Customer },
): string {
  const full = buildBasketMessage(lang, o, false);
  // A very long basket gets shorter item lines, but never loses an item, a quantity or the total.
  return full.length <= MAX_MESSAGE_CHARS ? full : buildBasketMessage(lang, o, true);
}

function buildBasketMessage(
  lang: Lang,
  o: { lines: BasketLine[]; extras: Extras; total: number; customer: Customer },
  compact: boolean,
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
      const chosen = (l.options ?? []).map((o) => pick(o.choice, o.choiceNe, lang)).join(", ");
      const name = `${pick(l.name, l.nameNe, lang)}${chosen ? ` – ${chosen}` : ""}`;
      out.push(compact
        ? `• ${l.qty} x ${name} = ${formatNPR(l.qty * l.price)}`
        : `• ${l.qty} x ${name} (${formatNPR(l.price)}) = ${formatNPR(l.qty * l.price)}`);
      if (l.note.trim()) out.push(`   ↳ ${compact ? l.note.trim().slice(0, 40) : l.note.trim()}`);
    }
  }
  if (o.lines.length > 0) out.push("", `${t.itemsTotal}: ${formatNPR(o.total)}`);
  // (The promo code is written with the customer's details below, not here.)

  if (o.extras.shoppingList.trim()) out.push("", `${t.shoppingList}:`, o.extras.shoppingList.trim());

  const g = o.extras.gift;
  if (o.lines.some((l) => l.placeType === "gifts")) {
    const gl = [
      g.occasion && (t.occasions as Record<string, string>)[g.occasion] && `${t.giftOccasion}: ${(t.occasions as Record<string, string>)[g.occasion]}`,
      g.recipientName && `${t.giftTo}: ${g.recipientName}`,
      g.recipientPhone && `${t.giftPhone}: ${g.recipientPhone}`,
      g.message && `${t.giftCard}: ${g.message}`,
      (g.date || g.time) && `${t.giftWhen}: ${[g.date, g.time].filter(Boolean).join(" ")}`,
    ].filter(Boolean) as string[];
    if (gl.length) out.push("", ...gl);
  }

  out.push(deliveryLine(lang, o.customer), "", ...customerBlock(lang, o.customer, o.extras.promo));
  return out.join("\n");
}

export function parcelMessage(lang: Lang, p: ParcelOrder, customer: Customer): string {
  const t = L[lang];
  return [
    t.header,
    `${t.orderType}: ${t.services.parcel}`,
    "",
    `${t.pickup}: ${p.pickup}`,
    ...(p.pickupPin ? [`📍 ${t.pickupMap}: ${mapLink(p.pickupPin)}`] : []),
    `${t.drop}: ${p.drop}`,
    ...(p.dropPin ? [`📍 ${t.dropMap}: ${mapLink(p.dropPin)}`] : []),
    `${t.item}: ${p.item}`,
    `${t.size}: ${t.sizes[p.size]}`,
    `${t.receiver}: ${p.receiverName}`,
    `${t.receiverPhone}: ${p.receiverPhone}`,
    deliveryLine(lang, customer),
    "",
    ...customerBlock(lang, customer, "", "parcel"),
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
    ...(a.budget.trim() ? [`${t.budget}: ${/^\d+$/.test(a.budget.trim()) ? formatNPR(Number(a.budget.trim())) : a.budget.trim()}`] : []),
    deliveryLine(lang, customer),
    "",
    ...customerBlock(lang, customer),
  ].join("\n");
}

export type BusinessType = "cafe" | "grocery" | "liquor" | "gifts" | "other";
export type Vehicle = "bike" | "scooter" | "bicycle" | "other";

export interface PartnerRequest {
  business: string;
  type: BusinessType;
  /** What the business is, when the type is "other". */
  typeOther?: string;
  contactName: string;
  phone: string;
  area: string;
  offer: string;
}

export interface RiderApplication {
  name: string;
  phone: string;
  area: string;
  /** False when the rider has no vehicle of their own. Default true. */
  hasVehicle?: boolean;
  vehicle: Vehicle;
  hasLicense: boolean;
  availability: string;
}

export function partnerMessage(lang: Lang, p: PartnerRequest): string {
  const t = L[lang].partner;
  return [
    t.header,
    `${t.business}: ${p.business}`,
    `${t.type}: ${t.types[p.type]}${p.type === "other" && p.typeOther?.trim() ? ` – ${p.typeOther.trim()}` : ""}`,
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
    `${t.ownVehicle}: ${r.hasVehicle === false ? t.no : t.yes}`,
    ...(r.hasVehicle === false ? [] : [`${t.vehicle}: ${t.vehicles[r.vehicle]}`]),
    `${t.license}: ${r.hasLicense ? t.yes : t.no}`,
    ...(r.availability.trim() ? [`${t.availability}: ${r.availability.trim()}`] : []),
  ].join("\n");
}

/**
 * The one place a WhatsApp link is made. Accepts "98XXXXXXXX", "+977 98…" or "97798…" and gives
 * https://api.whatsapp.com/send?phone=97798XXXXXXXX&text=<message>.
 * The message is always percent-encoded, so line breaks, & and #, and Nepali text arrive as written.
 *
 * Why not wa.me? wa.me forwards to this same address, but on the way it turns every emoji into a broken "�"
 * (checked 19 Nov 2026: 🛵 📍 🕒 ✅ 🍔 all came out as %EF%BF%BD). Going straight to api.whatsapp.com keeps them intact.
 */
export function buildWhatsAppUrl(number: string, message: string): string {
  let d = number.replace(/\D/g, "");
  if (d.startsWith("977") && d.length > 10) d = d.slice(3);
  return `https://api.whatsapp.com/send?phone=977${d}&text=${encodeURIComponent(message)}`;
}

/** What the button on a place with no menu opens with: "Hi, I'd like to order from Anzee's Cafe & Bakery." */
export function placeOrderMessage(lang: Lang, name: string): string {
  return L[lang].placeOrder.replace("{name}", name);
}

/** What a plain "WhatsApp us" button opens with, so the chat is never blank. */
export function greetingMessage(lang: Lang): string {
  return L[lang].greeting;
}
