// Pure edits on the admin data. The panel keeps a draft AdminData and applies these to it.
import type { BranchEntry, BranchMenuFile, CatalogItem } from '../menu';
import { applyBulk, type BulkOp } from './price';
import { canonicalEntry, canonicalItem } from './format';
import { uniqueId } from './slug';
import type { AdminData } from './model';

const catOf = (d: AdminData) => new Map(d.catalog.items.map((i) => [i.id, i.category]));

/** Combos whose `includes` point at this item. */
export const usedInCombos = (d: AdminData, id: string) => d.catalog.items.filter((i) => i.includes?.some((s) => s.anyOf.includes(id)));

/** Branches that sell this item. */
export const soldAt = (d: AdminData, id: string) => Object.keys(d.menus).filter((b) => d.menus[b].items.some((e) => e.id === id));

// ---------- catalog (shared by every branch)

export function updateCatalogItem(d: AdminData, id: string, patch: Partial<CatalogItem>): AdminData {
  const prev = d.catalog.items.find((i) => i.id === id);
  if (!prev) return d;
  const next: CatalogItem = { ...prev, ...patch, id }; // an existing id never changes
  if ('group' in patch && patch.group === undefined) delete next.group;
  if ('image' in patch && !patch.image) delete next.image;
  const item = canonicalItem(next);
  let out: AdminData = { ...d, catalog: { ...d.catalog, items: d.catalog.items.map((i) => (i.id === id ? item : i)) } };
  // moved to another category: it goes to the end of that category, in the catalog and in every branch
  if (item.category !== prev.category) {
    out = { ...out, catalog: { ...out.catalog, items: moveToCategoryEnd(out.catalog.items, id, (i) => i.category) } };
    const cats = catOf(out);
    out = { ...out, menus: mapMenus(out, (m) => ({ items: moveToCategoryEnd(m.items, id, (e) => cats.get(e.id)) })) };
  }
  return out;
}

function moveToCategoryEnd<T extends { id: string }>(list: T[], id: string, cat: (x: T) => string | undefined): T[] {
  const item = list.find((x) => x.id === id);
  if (!item) return list;
  const rest = list.filter((x) => x.id !== id);
  const c = cat(item);
  const last = rest.map(cat).lastIndexOf(c);
  rest.splice(last === -1 ? rest.length : last + 1, 0, item);
  return rest;
}

const mapMenus = (d: AdminData, fn: (m: BranchMenuFile, branch: string) => BranchMenuFile) =>
  Object.fromEntries(Object.entries(d.menus).map(([b, m]) => [b, fn(m, b)]));

export type NewEntry = Omit<BranchEntry, 'id'>;

/**
 * A new product: shared catalog data + a price line for each branch that sells it.
 * It lands at the end of its category in the catalog and in each of those branches.
 */
export function addProduct(d: AdminData, draft: Omit<CatalogItem, 'id'>, perBranch: Record<string, NewEntry>): { data: AdminData; id: string } {
  const id = uniqueId(draft.name.az, new Set(d.catalog.items.map((i) => i.id)));
  const item = canonicalItem({ ...draft, id });
  const items = [...d.catalog.items];
  const last = items.map((i) => i.category).lastIndexOf(item.category);
  items.splice(last === -1 ? items.length : last + 1, 0, item);
  let out: AdminData = { ...d, catalog: { ...d.catalog, items } };
  for (const [b, e] of Object.entries(perBranch)) out = setSold(out, b, id, e);
  return { data: out, id };
}

/** Delete from the catalog, from every branch, and from combo `includes` (empty slots go too). */
export function deleteProducts(d: AdminData, ids: string[]): AdminData {
  const gone = new Set(ids);
  const items = d.catalog.items
    .filter((i) => !gone.has(i.id))
    .map((i) => {
      if (!i.includes?.some((s) => s.anyOf.some((a) => gone.has(a)))) return i;
      const includes = i.includes.map((s) => ({ ...s, anyOf: s.anyOf.filter((a) => !gone.has(a)) })).filter((s) => s.anyOf.length);
      const { includes: _, ...rest } = i;
      void _;
      return includes.length ? { ...rest, includes } : rest;
    });
  return { ...d, catalog: { ...d.catalog, items }, menus: mapMenus(d, (m) => ({ items: m.items.filter((e) => !gone.has(e.id)) })) };
}

export function duplicateProduct(d: AdminData, id: string): { data: AdminData; id: string } {
  const src = d.catalog.items.find((i) => i.id === id)!;
  const { id: _, ...rest } = src;
  void _;
  const perBranch = Object.fromEntries(
    Object.entries(d.menus)
      .map(([b, m]) => [b, m.items.find((e) => e.id === id)] as const)
      .filter(([, e]) => e)
      .map(([b, e]) => {
        const { id: __, ...entry } = e!;
        void __;
        return [b, entry];
      }),
  );
  return addProduct(d, { ...rest, name: { ...src.name, az: `${src.name.az} (kopya)` } }, perBranch);
}

// ---------- one branch's menu

/** Price, old price, "bitib" or own ingredients at one branch. `undefined` removes an optional field. */
export function updateEntry(d: AdminData, branch: string, id: string, patch: Partial<NewEntry>): AdminData {
  const m = d.menus[branch];
  if (!m?.items.some((e) => e.id === id)) return d;
  return {
    ...d,
    menus: {
      ...d.menus,
      [branch]: {
        items: m.items.map((e) => {
          if (e.id !== id) return e;
          const next: BranchEntry = { ...e, ...patch, id };
          if ('oldPrice' in patch && patch.oldPrice === undefined) delete next.oldPrice;
          if ('description' in patch && patch.description === undefined) delete next.description;
          return canonicalEntry(next);
        }),
      },
    },
  };
}

/**
 * "Bu filialda satılır": put an item on a branch's menu (at the end of its category) or, with null, take it off.
 * Taking it off is not "bitib": "bitib" keeps it on the menu, hidden for now.
 */
export function setSold(d: AdminData, branch: string, id: string, entry: NewEntry | null): AdminData {
  const m = d.menus[branch];
  if (!m) return d;
  const without = m.items.filter((e) => e.id !== id);
  if (!entry) return { ...d, menus: { ...d.menus, [branch]: { items: without } } };
  if (m.items.some((e) => e.id === id)) return updateEntry(d, branch, id, entry);
  const cats = catOf(d);
  const c = cats.get(id);
  const last = without.map((e) => cats.get(e.id)).lastIndexOf(c);
  // no item of this category yet: keep the catalog's category order
  let at = last + 1;
  if (last === -1) {
    const order = d.catalog.categories.map((x) => x.id);
    const pos = order.indexOf(c ?? '');
    at = without.findIndex((e) => order.indexOf(cats.get(e.id) ?? '') > pos);
    if (at === -1) at = without.length;
  }
  const items = [...without];
  items.splice(at, 0, canonicalEntry({ ...entry, id }));
  return { ...d, menus: { ...d.menus, [branch]: { items } } };
}

/** Swap with the neighbour of the same category in this branch's order. */
export function moveEntry(d: AdminData, branch: string, id: string, dir: -1 | 1): AdminData {
  const items = [...d.menus[branch].items];
  const cats = catOf(d);
  const idx = items.findIndex((e) => e.id === id);
  if (idx < 0) return d;
  let j = idx + dir;
  while (j >= 0 && j < items.length && cats.get(items[j].id) !== cats.get(id)) j += dir;
  if (j < 0 || j >= items.length) return d;
  [items[idx], items[j]] = [items[j], items[idx]];
  return { ...d, menus: { ...d.menus, [branch]: { items } } };
}

/** Drag-and-drop: put `id` right before `beforeId`, or at the end of its category when null. */
export function placeEntry(d: AdminData, branch: string, id: string, beforeId: string | null): AdminData {
  const m = d.menus[branch];
  const item = m.items.find((e) => e.id === id);
  if (!item || id === beforeId) return d;
  const cats = catOf(d);
  const items = m.items.filter((e) => e.id !== id);
  let at = beforeId ? items.findIndex((e) => e.id === beforeId) : items.map((e) => cats.get(e.id)).lastIndexOf(cats.get(id)) + 1;
  if (at < 0) at = items.length;
  items.splice(at, 0, item);
  return { ...d, menus: { ...d.menus, [branch]: { items } } };
}

// ---------- bulk prices

export type BulkPreview = { branch: string; id: string; name: string; from: number; to: number; problem?: string }[];

/** Rows for every selected item at every selected branch that sells it. */
export function previewBulk(d: AdminData, branches: string[], ids: string[], op: BulkOp): BulkPreview {
  const names = new Map(d.catalog.items.map((i) => [i.id, i.group ? `${i.name.az} (${i.group.az})` : i.name.az]));
  const set = new Set(ids);
  return branches.flatMap((b) =>
    (d.menus[b]?.items ?? [])
      .filter((e) => set.has(e.id))
      .map((e) => {
        const to = applyBulk(e.price, op);
        const problem = to <= 0 ? 'Qiymət 0-dan böyük olmalıdır' : e.oldPrice !== undefined && to >= e.oldPrice ? `Köhnə qiymətdən (${e.oldPrice.toFixed(2)}) böyük olur` : undefined;
        return { branch: b, id: e.id, name: names.get(e.id) ?? e.id, from: e.price, to, ...(problem && { problem }) };
      }),
  );
}

export function applyBulkPrices(d: AdminData, preview: BulkPreview): AdminData {
  return preview.reduce((acc, p) => updateEntry(acc, p.branch, p.id, { price: p.to }), d);
}
