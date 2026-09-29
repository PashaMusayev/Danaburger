import { TAGS, type MenuData, type RawMenuItem } from '../menu';
import { parsePrice } from './price';

export type FieldErrors = Partial<Record<'name' | 'price' | 'oldPrice' | 'category' | 'group' | 'image', string>>;

const validPrice = (n: unknown) => typeof n === 'number' && parsePrice(n.toFixed(2)) === n;

/** Errors for a single item (shown under the form fields). */
export function validateItem(i: RawMenuItem, categoryIds: Set<string>): FieldErrors {
  const e: FieldErrors = {};
  if (!i.name?.az?.trim()) e.name = 'Ad (AZ) boş ola bilməz.';
  if (!categoryIds.has(i.category)) e.category = 'Kateqoriya seçin.';
  if (!validPrice(i.price)) e.price = 'Qiymət 0-dan böyük olmalıdır, məs. 5.80';
  if (i.oldPrice !== undefined) {
    if (!validPrice(i.oldPrice)) e.oldPrice = 'Köhnə qiymət düzgün deyil.';
    else if (i.oldPrice <= i.price) e.oldPrice = 'Köhnə qiymət yeni qiymətdən böyük olmalıdır.';
  }
  if (i.image && !/^\/img\/[a-z0-9/_-]+\.(webp|jpg|png)$/.test(i.image)) e.image = 'Foto yolu düzgün deyil.';
  return e;
}

/** Soft warning: same name twice in one category. */
export function duplicateName(i: RawMenuItem, all: RawMenuItem[]): boolean {
  const n = i.name.az.trim().toLocaleLowerCase('az');
  return all.some((x) => x.id !== i.id && x.category === i.category && x.name.az.trim().toLocaleLowerCase('az') === n && (x.group?.az ?? '') === (i.group?.az ?? ''));
}

/** Whole-menu check run on the server before anything is committed. Returns human-readable problems. */
export function validateMenu(m: unknown): string[] {
  const errs: string[] = [];
  const menu = m as MenuData;
  if (!menu || typeof menu !== 'object' || !Array.isArray(menu.items) || !Array.isArray(menu.categories)) return ['Menyu formatı düzgün deyil.'];
  const cats = new Set(menu.categories.map((c) => c.id));
  const ids = new Set<string>();
  for (const i of menu.items) {
    const label = i?.name?.az || i?.id || '?';
    if (!i || typeof i.id !== 'string' || !/^[a-z0-9-]+$/.test(i.id)) {
      errs.push(`"${label}": id düzgün deyil.`);
      continue;
    }
    if (ids.has(i.id)) errs.push(`"${label}": eyni id iki dəfə var (${i.id}).`);
    ids.add(i.id);
    if (typeof i.description !== 'string') errs.push(`"${label}": tərkib mətn olmalıdır.`);
    if (typeof i.available !== 'boolean') errs.push(`"${label}": mövcudluq düzgün deyil.`);
    if (!Array.isArray(i.tags) || i.tags.some((t) => !TAGS.includes(t))) errs.push(`"${label}": etiketlər düzgün deyil.`);
    for (const [k, v] of Object.entries(validateItem(i, cats))) errs.push(`"${label}" (${k}): ${v}`);
  }
  for (const i of menu.items) {
    for (const s of i.includes ?? []) {
      if (!Number.isInteger(s.qty) || s.qty < 1) errs.push(`"${i.name.az}": set tərkibində say düzgün deyil.`);
      for (const id of s.anyOf) if (!ids.has(id)) errs.push(`"${i.name.az}": set tərkibində olmayan məhsul var (${id}).`);
    }
  }
  return errs;
}
