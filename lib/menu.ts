import data from '@/data/menu.json';

export type Locale = 'az' | 'ru' | 'en';
export type L10n = Record<Locale, string>;
export type Tag = 'popular' | 'new' | 'spicy' | 'chicken' | 'meat' | 'veg';

export type MenuItem = {
  id: string;
  category: string;
  group?: L10n;
  name: L10n;
  description: string;
  price: number;
  oldPrice?: number;
  image?: string;
  tags: Tag[];
  available: boolean;
  includes?: { anyOf: string[]; qty: number }[];
};

export type Category = { id: string; name: L10n; icon: string };

export const categories = data.categories as Category[];
export const items = (data.items as MenuItem[]).filter((i) => i.available);
export const itemById = new Map(items.map((i) => [i.id, i]));

export const deals = items
  .filter((i) => i.oldPrice && i.oldPrice > i.price)
  .sort((a, b) => b.oldPrice! - b.price - (a.oldPrice! - a.price));

export const savings = (i: MenuItem) => (i.oldPrice ? i.oldPrice - i.price : 0);

export const fmt = (n: number) => n.toFixed(2);
