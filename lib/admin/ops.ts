import type { MenuData, RawMenuItem } from '../menu';
import { applyBulk, type BulkOp } from './price';
import { canonicalItem } from './format';
import { uniqueId } from './slug';

/** Combos whose `includes` point at this item. */
export const usedInCombos = (m: MenuData, id: string) => m.items.filter((i) => i.includes?.some((s) => s.anyOf.includes(id)));

/** Delete items and drop every reference to them from combo `includes` (empty slots go too). */
export function deleteItems(m: MenuData, ids: string[]): MenuData {
  const gone = new Set(ids);
  return {
    ...m,
    items: m.items
      .filter((i) => !gone.has(i.id))
      .map((i) => {
        if (!i.includes?.some((s) => s.anyOf.some((a) => gone.has(a)))) return i;
        const includes = i.includes.map((s) => ({ ...s, anyOf: s.anyOf.filter((a) => !gone.has(a)) })).filter((s) => s.anyOf.length);
        const { includes: _, ...rest } = i;
        void _;
        return includes.length ? { ...rest, includes } : rest;
      }),
  };
}

/** New items go to the end of their category so they appear where the owner expects. */
export function addItem(m: MenuData, draft: Omit<RawMenuItem, 'id'>): { menu: MenuData; id: string } {
  const id = uniqueId(draft.name.az, new Set(m.items.map((i) => i.id)));
  const item = canonicalItem({ ...draft, id });
  const lastInCat = m.items.map((i) => i.category).lastIndexOf(item.category);
  const items = [...m.items];
  items.splice(lastInCat === -1 ? items.length : lastInCat + 1, 0, item);
  return { menu: { ...m, items }, id };
}

export function updateItem(m: MenuData, id: string, patch: Partial<RawMenuItem>): MenuData {
  const idx = m.items.findIndex((i) => i.id === id);
  if (idx < 0) return m;
  const prev = m.items[idx];
  const next: RawMenuItem = { ...prev, ...patch, id: prev.id }; // an existing id never changes
  if ('oldPrice' in patch && patch.oldPrice === undefined) delete next.oldPrice;
  if ('group' in patch && patch.group === undefined) delete next.group;
  if ('image' in patch && !patch.image) delete next.image;
  const item = canonicalItem(next);
  const items = [...m.items];
  if (item.category === prev.category) {
    items[idx] = item;
    return { ...m, items };
  }
  // moved to another category: it goes to the end of that category
  items.splice(idx, 1);
  const last = items.map((i) => i.category).lastIndexOf(item.category);
  items.splice(last === -1 ? items.length : last + 1, 0, item);
  return { ...m, items };
}

/** Swap an item with its neighbour inside the same category. */
export function moveItem(m: MenuData, id: string, dir: -1 | 1): MenuData {
  const idx = m.items.findIndex((i) => i.id === id);
  if (idx < 0) return m;
  const cat = m.items[idx].category;
  let j = idx + dir;
  while (j >= 0 && j < m.items.length && m.items[j].category !== cat) j += dir;
  if (j < 0 || j >= m.items.length) return m;
  const items = [...m.items];
  [items[idx], items[j]] = [items[j], items[idx]];
  return { ...m, items };
}

/** Drag-and-drop: put `id` right before `beforeId` (same category), or at the end of it when null. */
export function placeItem(m: MenuData, id: string, beforeId: string | null): MenuData {
  const item = m.items.find((i) => i.id === id);
  if (!item || id === beforeId) return m;
  const items = m.items.filter((i) => i.id !== id);
  let at = beforeId ? items.findIndex((i) => i.id === beforeId) : items.map((i) => i.category).lastIndexOf(item.category) + 1;
  if (at < 0) at = items.length;
  items.splice(at, 0, item);
  return { ...m, items };
}

export function duplicateItem(m: MenuData, id: string): { menu: MenuData; id: string } {
  const src = m.items.find((i) => i.id === id)!;
  const { id: _, ...rest } = src;
  void _;
  return addItem(m, { ...rest, name: { ...src.name, az: `${src.name.az} (kopya)` } });
}

export type BulkPreview = { id: string; name: string; from: number; to: number; problem?: string }[];

export function previewBulk(m: MenuData, ids: string[], op: BulkOp): BulkPreview {
  const set = new Set(ids);
  return m.items
    .filter((i) => set.has(i.id))
    .map((i) => {
      const to = applyBulk(i.price, op);
      const problem = to <= 0 ? 'Qiymət 0-dan böyük olmalıdır' : i.oldPrice !== undefined && to >= i.oldPrice ? `Köhnə qiymətdən (${i.oldPrice.toFixed(2)}) böyük olur` : undefined;
      return { id: i.id, name: i.group ? `${i.name.az} (${i.group.az})` : i.name.az, from: i.price, to, ...(problem && { problem }) };
    });
}

export function applyBulkPrices(m: MenuData, preview: BulkPreview): MenuData {
  const to = new Map(preview.map((p) => [p.id, p.to]));
  return { ...m, items: m.items.map((i) => (to.has(i.id) ? { ...i, price: to.get(i.id)! } : i)) };
}
