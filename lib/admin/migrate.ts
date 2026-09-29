// Splits the pre-branches data/menu.json (prices inside each item) into a shared catalog and one
// branch menu. No imports besides types, so `node scripts/migrate-to-branches.ts` can run it directly.
import type { BranchMenuFile, Catalog, CatalogItem, Tag, Include, RawL10n, Category } from '../menu';

export type LegacyItem = {
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
export type LegacyMenu = { currency: string; categories: Category[]; items: LegacyItem[] };

export const isLegacyMenu = (m: unknown): m is LegacyMenu =>
  !!m && Array.isArray((m as LegacyMenu).items) && (m as LegacyMenu).items.some((i) => typeof i.price === 'number');

export function splitLegacyMenu(m: LegacyMenu): { catalog: Catalog; branch: BranchMenuFile } {
  const items: CatalogItem[] = m.items.map((i) => ({
    id: i.id,
    category: i.category,
    ...(i.group && { group: i.group }),
    name: i.name,
    description: i.description,
    ...(i.image && { image: i.image }),
    tags: i.tags,
    ...(i.includes && { includes: i.includes }),
  }));
  const branch: BranchMenuFile = {
    items: m.items.map((i) => ({
      id: i.id,
      price: i.price,
      ...(i.oldPrice !== undefined && { oldPrice: i.oldPrice }),
      available: i.available,
    })),
  };
  return { catalog: { currency: m.currency, categories: m.categories, items }, branch };
}
