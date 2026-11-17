"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PlaceType } from "@/types/db";

export interface BasketLine {
  itemId: string;
  placeId: string;
  placeName: string;
  placeNameNe: string | null;
  /** Address of the place's page, for "add more". Older saved baskets do not have it. */
  placeSlug?: string;
  placeType: PlaceType;
  name: string;
  nameNe: string | null;
  price: number;
  qty: number;
  note: string;
}

export interface GiftDetails {
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
  gift: { recipientName: "", recipientPhone: "", message: "", date: "", time: "" },
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
  add: (line: Omit<BasketLine, "qty" | "note">) => void;
  setQty: (itemId: string, qty: number) => void;
  setNote: (itemId: string, note: string) => void;
  remove: (itemId: string) => void;
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

  const add = useCallback<BasketApi["add"]>((line) => {
    setState((s) => {
      const existing = s.lines.find((l) => l.itemId === line.itemId);
      const lines = existing
        ? s.lines.map((l) => (l.itemId === line.itemId ? { ...l, qty: l.qty + 1 } : l))
        : [...s.lines, { ...line, qty: 1, note: "" }];
      return { ...s, lines };
    });
  }, []);

  const setQty = useCallback((itemId: string, qty: number) => {
    setState((s) => ({
      ...s,
      lines: qty <= 0 ? s.lines.filter((l) => l.itemId !== itemId) : s.lines.map((l) => (l.itemId === itemId ? { ...l, qty } : l)),
    }));
  }, []);

  const setNote = useCallback((itemId: string, note: string) => {
    setState((s) => ({ ...s, lines: s.lines.map((l) => (l.itemId === itemId ? { ...l, note } : l)) }));
  }, []);

  const remove = useCallback((itemId: string) => setQty(itemId, 0), [setQty]);

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
