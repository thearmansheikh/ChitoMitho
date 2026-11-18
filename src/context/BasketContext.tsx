"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PlaceType } from "@/types/db";

/** One choice the customer made on an item, e.g. Size: Large (+Rs. 50). */
export interface LineOption {
  group: string;
  groupNe?: string | null;
  choice: string;
  choiceNe?: string | null;
  price: number;
}

export interface BasketLine {
  /** Identifies this line in the basket. Same item with different choices means different lines. Defaults to itemId. */
  key?: string;
  itemId: string;
  placeId: string;
  placeName: string;
  placeNameNe: string | null;
  /** Address of the place's page, for "add more". Older saved baskets do not have it. */
  placeSlug?: string;
  placeType: PlaceType;
  name: string;
  nameNe: string | null;
  /** Unit price including any option prices. */
  price: number;
  /** The item's own price before options, so "Order again" can re-price a line with options. */
  basePrice?: number;
  options?: LineOption[];
  qty: number;
  note: string;
}

/** The key that identifies a line in the basket. */
export const lineKey = (l: { key?: string; itemId: string }): string => l.key ?? l.itemId;

export interface GiftDetails {
  /** Key such as "birthday", or "" when none was chosen. */
  occasion: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  date: string;
  time: string;
}

export interface Extras {
  shoppingList: string;
  gift: GiftDetails;
  /** A promo code the customer typed and the site recognised. The team applies it on WhatsApp. */
  promo: string;
}

const EMPTY_EXTRAS: Extras = {
  shoppingList: "",
  promo: "",
  gift: { occasion: "", recipientName: "", recipientPhone: "", message: "", date: "", time: "" },
};

interface State {
  lines: BasketLine[];
  extras: Extras;
}

/** The last order sent to WhatsApp, kept only on this phone so it can be repeated. */
export interface LastOrder {
  lines: BasketLine[];
  shoppingList: string;
  total: number;
  savedAt: string; // ISO date
}

interface BasketApi extends State {
  lastOrder: LastOrder | null;
  saveLastOrder: (o: { lines: BasketLine[]; shoppingList: string; total: number }) => void;
  /** Replace the basket (used by "Order again"). Gift details are not restored: dates go stale. */
  loadIntoBasket: (lines: BasketLine[], shoppingList: string) => void;
  /** One-off message shown on the basket page (e.g. "2 items are sold out"). Memory only. */
  notice: string | null;
  setNotice: (m: string | null) => void;
  hydrated: boolean;
  count: number;
  total: number;
  /** Adds one of the line, or `qty` of it with a note (from the item sheet). */
  add: (line: Omit<BasketLine, "qty" | "note">, extra?: { qty?: number; note?: string }) => void;
  setQty: (key: string, qty: number) => void;
  setNote: (key: string, note: string) => void;
  remove: (key: string) => void;
  setShoppingList: (v: string) => void;
  setGift: (g: Partial<GiftDetails>) => void;
  setPromo: (code: string) => void;
  clear: () => void;
}

const KEY = "cm-basket-v1";
const LAST_KEY = "cm-last-order-v1";
const Ctx = createContext<BasketApi | null>(null);

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ lines: [], extras: EMPTY_EXTRAS });
  const [hydrated, setHydrated] = useState(false);
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const rawLast = localStorage.getItem(LAST_KEY);
      if (rawLast) {
        const l = JSON.parse(rawLast) as Partial<LastOrder>;
        if (Array.isArray(l.lines)) {
          setLastOrder({ lines: l.lines, shoppingList: l.shoppingList ?? "", total: Number(l.total) || 0, savedAt: l.savedAt ?? "" });
        }
      }
    } catch {
      /* ignore */
    }
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<State>;
        setState({
          lines: Array.isArray(p.lines) ? p.lines : [],
          extras: { ...EMPTY_EXTRAS, ...p.extras, gift: { ...EMPTY_EXTRAS.gift, ...p.extras?.gift } },
        });
      }
    } catch {
      /* corrupt or unavailable storage: start empty */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked */
    }
  }, [state, hydrated]);

  const add = useCallback<BasketApi["add"]>((line, extra) => {
    const n = Math.max(1, Math.min(99, Math.floor(extra?.qty ?? 1)));
    const note = (extra?.note ?? "").trim();
    const key = lineKey(line);
    setState((s) => {
      const existing = s.lines.find((l) => lineKey(l) === key);
      const lines = existing
        ? s.lines.map((l) =>
            lineKey(l) === key
              ? { ...l, qty: Math.min(99, l.qty + n), note: note && !l.note.includes(note) ? [l.note, note].filter(Boolean).join("; ") : l.note }
              : l,
          )
        : [...s.lines, { ...line, qty: n, note }];
      return { ...s, lines };
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setState((s) => ({
      ...s,
      lines: qty <= 0 ? s.lines.filter((l) => lineKey(l) !== key) : s.lines.map((l) => (lineKey(l) === key ? { ...l, qty } : l)),
    }));
  }, []);

  const setNote = useCallback((key: string, note: string) => {
    setState((s) => ({ ...s, lines: s.lines.map((l) => (lineKey(l) === key ? { ...l, note } : l)) }));
  }, []);

  const remove = useCallback((key: string) => setQty(key, 0), [setQty]);

  const setShoppingList = useCallback((v: string) => {
    setState((s) => ({ ...s, extras: { ...s.extras, shoppingList: v } }));
  }, []);

  const setGift = useCallback((g: Partial<GiftDetails>) => {
    setState((s) => ({ ...s, extras: { ...s.extras, gift: { ...s.extras.gift, ...g } } }));
  }, []);

  const setPromo = useCallback((code: string) => {
    setState((s) => ({ ...s, extras: { ...s.extras, promo: code } }));
  }, []);

  const clear = useCallback(() => setState({ lines: [], extras: EMPTY_EXTRAS }), []);

  const saveLastOrder = useCallback<BasketApi["saveLastOrder"]>((o) => {
    if (o.lines.length === 0 && !o.shoppingList.trim()) return;
    const saved: LastOrder = { ...o, savedAt: new Date().toISOString() };
    setLastOrder(saved);
    try {
      localStorage.setItem(LAST_KEY, JSON.stringify(saved));
    } catch {
      /* storage blocked */
    }
  }, []);

  const loadIntoBasket = useCallback<BasketApi["loadIntoBasket"]>((lines, shoppingList) => {
    setState({ lines, extras: { ...EMPTY_EXTRAS, shoppingList } });
  }, []);

  const value = useMemo<BasketApi>(() => {
    const count = state.lines.reduce((n, l) => n + l.qty, 0);
    const total = state.lines.reduce((n, l) => n + l.qty * l.price, 0);
    return {
      ...state, hydrated, count, total, add, setQty, setNote, remove, setShoppingList, setGift, setPromo, clear,
      lastOrder, saveLastOrder, loadIntoBasket, notice, setNotice,
    };
  }, [state, hydrated, add, setQty, setNote, remove, setShoppingList, setGift, setPromo, clear, lastOrder, saveLastOrder, loadIntoBasket, notice]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBasket(): BasketApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useBasket must be used inside BasketProvider");
  return v;
}
