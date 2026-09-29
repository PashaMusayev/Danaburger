// Types and pure helpers for the menu. Data files are loaded in lib/branches.ts.
//
// data/menu.json            catalog: every product any branch sells (names, photos, tags, default ingredients)
// data/branches.json        the branches: contacts, address, coordinates, hours
// data/branches/<id>.json   one branch's menu: which catalog items it sells, at what price, in what order

export type Locale = 'az' | 'ru' | 'en';
export type L10n = Record<Locale, string>;
export type Tag = 'popular' | 'new' | 'spicy' | 'chicken' | 'meat' | 'veg';
export const TAGS: Tag[] = ['popular', 'new', 'spicy', 'chicken', 'meat', 'veg'];

/** AZ is required; RU/EN may be left empty in the admin panel and fall back to AZ on the site. */
export type RawL10n = { az: string; ru?: string; en?: string };
export type Include = { anyOf: string[]; qty: number };
export type Category = { id: string; name: L10n; icon: string };

/** One line of data/menu.json. Shared by every branch. */
export type CatalogItem = {
  id: string;
  category: string;
  group?: RawL10n;
  name: RawL10n;
  description: string;
  image?: string;
  tags: Tag[];
  includes?: Include[];
};
export type Catalog = { currency: string; categories: Category[]; items: CatalogItem[] };

/** One line of data/branches/<id>.json. An item missing from the file isn't sold at that branch. */
export type BranchEntry = {
  id: string;
  price: number;
  oldPrice?: number;
  /** false = "bitib": still on this branch's menu, hidden for now */
  available: boolean;
  /** this branch's own ingredients, shown instead of the catalog description */
  description?: string;
};
export type BranchMenuFile = { items: BranchEntry[] };

export type Geo = { lat: number; lng: number };
export type BranchInfo = {
  id: string;
  name: L10n;
  address: RawL10n;
  geo: Geo | null;
  hours: { open: string; close: string };
  phone: string;
  whatsapp: string;
};
export type BranchesFile = { branches: BranchInfo[] };

/** An item as the public site shows it at one branch: catalog + branch price, every locale filled in. */
export type MenuItem = Omit<CatalogItem, 'name' | 'group'> & {
  name: L10n;
  group?: L10n;
  price: number;
  oldPrice?: number;
  available: boolean;
};

export type BranchMenu = {
  categories: Category[];
  /** on sale now, in the branch's order */
  items: MenuItem[];
  itemById: Map<string, MenuItem>;
  deals: MenuItem[];
  /** combos whose every slot can be filled from this branch's menu (for "setə keç") */
  combos: MenuItem[];
  /** sauces offered with food; empty when the branch sells none */
  sauces: MenuItem[];
};

export const fill = (l: RawL10n): L10n => ({ az: l.az, ru: l.ru || l.az, en: l.en || l.az });

// Pickles, chilli and qatıq live in the Souslar category but aren't sauces you'd add to a burger.
const NOT_A_SAUCE = new Set(['qarisiq-tursu', 'cin-biber', 'qatiq']);
export const isSauce = (i: { id: string; category: string }) => i.category === 'sauces' && !NOT_A_SAUCE.has(i.id);

export function buildBranchMenu(catalog: Catalog, file: BranchMenuFile): BranchMenu {
  const byId = new Map(catalog.items.map((i) => [i.id, i]));
  const items: MenuItem[] = [];
  for (const e of file.items) {
    const c = byId.get(e.id);
    // "Bitib" items are left out of the site, cart offers and JSON-LD.
    if (!c || !e.available) continue;
    const { group, ...rest } = c;
    items.push({
      ...rest,
      name: fill(c.name),
      ...(group && { group: fill(group) }),
      description: e.description ?? c.description,
      price: e.price,
      ...(e.oldPrice !== undefined && { oldPrice: e.oldPrice }),
      available: true,
    });
  }
  const itemById = new Map(items.map((i) => [i.id, i]));
  const deals = items
    .filter((i) => i.oldPrice && i.oldPrice > i.price)
    .sort((a, b) => b.oldPrice! - b.price - (a.oldPrice! - a.price));
  // Only offer a combo when every slot can still be filled from what's on sale here.
  const combos = items
    .filter((i) => i.includes?.length)
    .map((c) => ({ ...c, includes: c.includes!.map((s) => ({ ...s, anyOf: s.anyOf.filter((id) => itemById.has(id)) })) }))
    .filter((c) => c.includes.every((s) => s.anyOf.length > 0));
  return { categories: catalog.categories, items, itemById, deals, combos, sauces: items.filter(isSauce) };
}

export const savings = (i: { price: number; oldPrice?: number }) => (i.oldPrice ? i.oldPrice - i.price : 0);

export const fmt = (n: number) => n.toFixed(2);
