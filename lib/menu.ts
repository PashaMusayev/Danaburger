import data from '@/data/menu.json';

export type Locale = 'az' | 'ru' | 'en';
export type L10n = Record<Locale, string>;
export type Tag = 'popular' | 'new' | 'spicy' | 'chicken' | 'meat' | 'veg';
export const TAGS: Tag[] = ['popular', 'new', 'spicy', 'chicken', 'meat', 'veg'];

/** AZ is required; RU/EN may be left empty in the admin panel and fall back to AZ on the site. */
export type RawL10n = { az: string; ru?: string; en?: string };
export type Include = { anyOf: string[]; qty: number };

/** One line of data/menu.json, exactly as stored. */
export type RawMenuItem = {
  id: string;
  category: string;
  group?: RawL10n;
  name: RawL10n;
  description: string;
  price: number;
  oldPrice?: number;
  image?: string;
  tags: Tag[];
  available: boolean;
  includes?: Include[];
};

export type Category = { id: string; name: L10n; icon: string };
export type MenuData = { currency: string; categories: Category[]; items: RawMenuItem[] };

/** An item as the public site uses it: every locale filled in. */
export type MenuItem = Omit<RawMenuItem, 'name' | 'group'> & { name: L10n; group?: L10n };

const fill = (l: RawL10n): L10n => ({ az: l.az, ru: l.ru || l.az, en: l.en || l.az });

export const menuData = data as MenuData;
export const categories = menuData.categories;
// "Bitib" (available: false) items are left out of the site, cart offers and JSON-LD.
export const items: MenuItem[] = menuData.items
  .filter((i) => i.available)
  .map(({ group, ...i }) => ({ ...i, name: fill(i.name), ...(group && { group: fill(group) }) }));
export const itemById = new Map(items.map((i) => [i.id, i]));

export const deals = items
  .filter((i) => i.oldPrice && i.oldPrice > i.price)
  .sort((a, b) => b.oldPrice! - b.price - (a.oldPrice! - a.price));

export const savings = (i: { price: number; oldPrice?: number }) => (i.oldPrice ? i.oldPrice - i.price : 0);

export const fmt = (n: number) => n.toFixed(2);
