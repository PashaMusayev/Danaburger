'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import az from './i18n/az';
import ru from './i18n/ru';
import en from './i18n/en';
import type { Dict } from './i18n/az';
import type { BranchInfo, BranchMenu, Locale, MenuItem } from './menu';
import { getBranch, getBranchMenu, DEFAULT_BRANCH } from './branches';
import { cartTotal, type CartLine } from './upsell';
import { track } from './analytics';

const dicts: Record<Locale, Dict> = { az, ru, en };
const LOCALE_KEY = 'db.locale';
export const LAST_BRANCH_KEY = 'db.branch';
// Each branch has its own cart: prices differ between branches.
export const cartKey = (branch: string) => `db.cart.${branch}`;
// Before branches there was one cart; its prices were Günəşli's.
const LEGACY_CART_KEY = 'db.cart.v1';

export const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
export const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / storage full: cart just won't persist */
  }
};

function readCart(branch: string, menu: BranchMenu): CartLine[] {
  let lines = read<CartLine[] | null>(cartKey(branch), null);
  if (lines === null && branch === DEFAULT_BRANCH) {
    lines = read<CartLine[]>(LEGACY_CART_KEY, []);
    if (lines.length) write(cartKey(branch), lines);
    try {
      localStorage.removeItem(LEGACY_CART_KEY);
    } catch {
      /* ignore */
    }
  }
  // items that were removed or marked "bitib" since the cart was saved drop out quietly
  return (lines ?? []).filter((x) => menu.itemById.has(x.id) && x.qty > 0);
}

type Store = {
  locale: Locale;
  t: Dict;
  setLocale: (l: Locale) => void;
  /** null on the brand home page (no branch chosen yet) */
  branch: BranchInfo | null;
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
const EMPTY_MENU = { itemById: new Map() } as BranchMenu;

export function StoreProvider({ branch: branchId, children }: { branch?: string; children: ReactNode }) {
  const branch = branchId ? getBranch(branchId) : null;
  const menu = branchId ? getBranchMenu(branchId) : EMPTY_MENU;
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
    if (branchId) {
      setCartState(readCart(branchId, menu));
      write(LAST_BRANCH_KEY, branchId);
    }
  }, [branchId, menu]);

  const t = dicts[locale];
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = branch ? t.meta.branchTitle(branch.name[locale]) : t.meta.title;
  }, [locale, branch, t]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    write(LOCALE_KEY, l);
  }, []);

  const key = branchId ? cartKey(branchId) : null;
  const persist = useCallback((c: CartLine[]) => key && write(key, c), [key]);

  const setCart = useCallback(
    (c: CartLine[]) => {
      setCartState(c);
      persist(c);
    },
    [persist],
  );

  const add = useCallback(
    (id: string, qty = 1) => {
      setCartState((prev) => {
        const next = prev.some((l) => l.id === id) ? prev.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l)) : [...prev, { id, qty }];
        persist(next);
        return next;
      });
      const item = menu.itemById.get(id);
      track('add_to_cart', { item_id: id, value: item?.price, branch: branchId });
      setToast(`${dicts[locale].menu.added} · ${item?.name[locale] ?? ''}`);
    },
    [locale, menu, persist, branchId],
  );

  const setQty = useCallback(
    (id: string, qty: number) => {
      setCartState((prev) => {
        const next = qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty } : l));
        persist(next);
        return next;
      });
    },
    [persist],
  );

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(id);
  }, [toast]);

  const value = useMemo<Store>(
    () => ({
      locale,
      t,
      setLocale,
      branch,
      cart,
      setCart,
      add,
      setQty,
      count: cart.reduce((s, l) => s + l.qty, 0),
      total: branchId ? cartTotal(menu, cart) : 0,
      cartOpen,
      setCartOpen,
      sheetItem,
      openItem,
      toast,
    }),
    [locale, t, setLocale, branch, cart, setCart, add, setQty, branchId, menu, cartOpen, sheetItem, toast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

/** The current branch and its menu. Only inside a branch page. */
export function useBranch(): { branch: BranchInfo; menu: BranchMenu } {
  const { branch } = useStore();
  if (!branch) throw new Error('useBranch outside a branch page');
  return { branch, menu: getBranchMenu(branch.id) };
}
