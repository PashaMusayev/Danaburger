'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import az from './i18n/az';
import ru from './i18n/ru';
import en from './i18n/en';
import type { Dict } from './i18n/az';
import type { Locale, MenuItem } from './menu';
import { itemById } from './menu';
import { cartTotal, type CartLine } from './upsell';
import { track } from './analytics';

const dicts: Record<Locale, Dict> = { az, ru, en };
const LOCALE_KEY = 'db.locale';
const CART_KEY = 'db.cart.v1';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / storage full: cart just won't persist */
  }
};

type Store = {
  locale: Locale;
  t: Dict;
  setLocale: (l: Locale) => void;
  cart: CartLine[];
  setCart: (c: CartLine[]) => void;
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  count: number;
  total: number;
  cartOpen: boolean;
  setCartOpen: (o: boolean) => void;
  sheetItem: MenuItem | null;
  openItem: (i: MenuItem | null) => void;
  toast: string | null;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('az');
  const [cart, setCartState] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [sheetItem, openItem] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Hydrate from storage after mount so the static HTML (AZ, empty cart) matches the first render.
  useEffect(() => {
    const urlLang = new URLSearchParams(location.search).get('lang');
    const saved = read<Locale | null>(LOCALE_KEY, null);
    const l = (['az', 'ru', 'en'] as const).find((x) => x === (urlLang ?? saved));
    if (l) setLocaleState(l);
    setCartState(read<CartLine[]>(CART_KEY, []).filter((x) => itemById.has(x.id) && x.qty > 0));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = dicts[locale].meta.title;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    write(LOCALE_KEY, l);
  }, []);

  const setCart = useCallback((c: CartLine[]) => {
    setCartState(c);
    write(CART_KEY, c);
  }, []);

  const add = useCallback(
    (id: string, qty = 1) => {
      setCartState((prev) => {
        const next = prev.some((l) => l.id === id)
          ? prev.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l))
          : [...prev, { id, qty }];
        write(CART_KEY, next);
        return next;
      });
      const item = itemById.get(id);
      track('add_to_cart', { item_id: id, value: item?.price });
      setToast(`${dicts[locale].menu.added} · ${item?.name[locale] ?? ''}`);
    },
    [locale],
  );

  const setQty = useCallback((id: string, qty: number) => {
    setCartState((prev) => {
      const next = qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty } : l));
      write(CART_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const value = useMemo<Store>(
    () => ({
      locale,
      t: dicts[locale],
      setLocale,
      cart,
      setCart,
      add,
      setQty,
      count: cart.reduce((s, l) => s + l.qty, 0),
      total: cartTotal(cart),
      cartOpen,
      setCartOpen,
      sheetItem,
      openItem,
      toast,
    }),
    [locale, setLocale, cart, setCart, add, setQty, cartOpen, sheetItem, toast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
