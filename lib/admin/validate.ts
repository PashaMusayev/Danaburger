import { TAGS, type BranchEntry, type CatalogItem } from '../menu';
import { parsePrice } from './price';
import { validateBranchInfo, validateSettings, isSettingsShape } from './settings';
import { branchName, type AdminData } from './model';

export type FieldErrors = Partial<Record<'name' | 'category' | 'image', string>>;
export type EntryErrors = Partial<Record<'price' | 'oldPrice', string>>;

export const validPrice = (n: unknown) => typeof n === 'number' && parsePrice(n.toFixed(2)) === n;

/** Catalog fields (shared by every branch). */
export function validateItem(i: CatalogItem, categoryIds: Set<string>): FieldErrors {
  const e: FieldErrors = {};
  if (!i.name?.az?.trim()) e.name = 'Ad (AZ) boş ola bilməz.';
  if (!categoryIds.has(i.category)) e.category = 'Kateqoriya seçin.';
  if (i.image && !/^\/img\/[a-z0-9/_-]+\.(webp|jpg|png)$/.test(i.image)) e.image = 'Foto yolu düzgün deyil.';
  return e;
}

/** One branch's price line. */
export function validateEntry(e: Pick<BranchEntry, 'price' | 'oldPrice'>): EntryErrors {
  const out: EntryErrors = {};
  if (!validPrice(e.price)) out.price = 'Qiymət 0-dan böyük olmalıdır, məs. 5.80';
  if (e.oldPrice !== undefined) {
    if (!validPrice(e.oldPrice)) out.oldPrice = 'Köhnə qiymət düzgün deyil.';
    else if (validPrice(e.price) && e.oldPrice <= e.price) out.oldPrice = 'Köhnə qiymət yeni qiymətdən böyük olmalıdır.';
  }
  return out;
}

/** Soft warning: same name twice in one category. */
export function duplicateName(i: CatalogItem, all: CatalogItem[]): boolean {
  const n = i.name.az.trim().toLocaleLowerCase('az');
  return all.some((x) => x.id !== i.id && x.category === i.category && x.name.az.trim().toLocaleLowerCase('az') === n && (x.group?.az ?? '') === (i.group?.az ?? ''));
}

const obj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

/**
 * Everything, as the server checks it before committing (the browser runs it too, to disable "Yayımla").
 * Returns human-readable problems; empty means OK.
 */
export function validateData(d: unknown): string[] {
  const errs: string[] = [];
  const data = d as AdminData;
  if (!obj(data) || !obj(data.catalog) || !Array.isArray(data.catalog.items) || !Array.isArray(data.catalog.categories)) return ['Menyu formatı düzgün deyil.'];
  if (!obj(data.branches) || !Array.isArray(data.branches.branches) || !obj(data.menus)) return ['Filial məlumatı düzgün deyil.'];

  // catalog
  const cats = new Set(data.catalog.categories.map((c) => c.id));
  const ids = new Set<string>();
  for (const i of data.catalog.items) {
    const label = i?.name?.az || i?.id || '?';
    if (!obj(i) || typeof i.id !== 'string' || !/^[a-z0-9-]+$/.test(i.id)) {
      errs.push(`"${label}": id düzgün deyil.`);
      continue;
    }
    if (ids.has(i.id)) errs.push(`"${label}": eyni id iki dəfə var (${i.id}).`);
    ids.add(i.id);
    if (typeof i.description !== 'string') errs.push(`"${label}": tərkib mətn olmalıdır.`);
    if (!Array.isArray(i.tags) || i.tags.some((t) => !TAGS.includes(t))) errs.push(`"${label}": etiketlər düzgün deyil.`);
    for (const v of Object.values(validateItem(i, cats))) errs.push(`"${label}": ${v}`);
  }
  for (const i of data.catalog.items) {
    for (const s of i.includes ?? []) {
      if (!Number.isInteger(s.qty) || s.qty < 1) errs.push(`"${i.name.az}": set tərkibində say düzgün deyil.`);
      for (const id of s.anyOf) if (!ids.has(id)) errs.push(`"${i.name.az}": set tərkibində olmayan məhsul var (${id}).`);
    }
  }

  // branches: the set of branches is fixed by data/branches.json; each needs a menu
  const branchIds = data.branches.branches.map((b) => b?.id);
  if (new Set(branchIds).size !== branchIds.length) errs.push('Eyni filial iki dəfə var.');
  const menuIds = Object.keys(data.menus);
  if (menuIds.length !== branchIds.length || menuIds.some((id) => !branchIds.includes(id))) errs.push('Filialların menyuları filial siyahısına uyğun deyil.');
  for (const b of data.branches.branches) {
    for (const v of Object.values(validateBranchInfo(b))) errs.push(`${b?.name?.az ?? b?.id}: ${v}`);
  }

  // branch menus
  for (const [bid, menu] of Object.entries(data.menus)) {
    const bn = branchName(data, bid);
    if (!obj(menu) || !Array.isArray(menu.items)) {
      errs.push(`${bn}: menyu formatı düzgün deyil.`);
      continue;
    }
    const seen = new Set<string>();
    for (const e of menu.items) {
      const label = data.catalog.items.find((i) => i.id === e?.id)?.name.az ?? e?.id;
      if (!obj(e) || !ids.has(e.id)) {
        errs.push(`${bn}: kataloqda olmayan məhsul (${e?.id}).`);
        continue;
      }
      if (seen.has(e.id)) errs.push(`${bn}: "${label}" iki dəfə var.`);
      seen.add(e.id);
      if (typeof e.available !== 'boolean') errs.push(`${bn}: "${label}": mövcudluq düzgün deyil.`);
      if (e.description !== undefined && typeof e.description !== 'string') errs.push(`${bn}: "${label}": tərkib mətn olmalıdır.`);
      for (const v of Object.values(validateEntry(e))) errs.push(`${bn}: "${label}": ${v}`);
    }
  }

  if (!isSettingsShape(data.settings)) errs.push('Ayarlar düzgün deyil.');
  else for (const v of Object.values(validateSettings(data.settings))) errs.push(`Ayarlar: ${v}`);
  return errs;
}
