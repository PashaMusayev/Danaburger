import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { BranchMenuFile, Catalog } from '@/lib/menu';
import { applyBulk, isSuspiciousChange, parsePrice } from '@/lib/admin/price';
import { searchNorm, slugify, uniqueId } from '@/lib/admin/slug';
import { duplicateName, validateData, validateEntry, validateItem } from '@/lib/admin/validate';
import { commitMessage, diffData } from '@/lib/admin/diff';
import {
  addProduct,
  applyBulkPrices,
  deleteProducts,
  duplicateProduct,
  moveEntry,
  placeEntry,
  previewBulk,
  setSold,
  soldAt,
  updateCatalogItem,
  updateEntry,
  usedInCombos,
} from '@/lib/admin/ops';
import { normalizePhone, parseGeo, validateBranchInfo, validateSettings } from '@/lib/admin/settings';
import type { AdminData } from '@/lib/admin/model';

const json = <T,>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;
const data: AdminData = {
  catalog: json<Catalog>('data/menu.json'),
  branches: json('data/branches.json'),
  settings: json('data/settings.json'),
  menus: Object.fromEntries(['gunesli', 'narimanov', '4-mkr'].map((b) => [b, json<BranchMenuFile>(`data/branches/${b}.json`)])),
};
const cats = new Set(data.catalog.categories.map((c) => c.id));
const entry = (d: AdminData, b: string, id: string) => d.menus[b].items.find((e) => e.id === id);
const item = (d: AdminData, id: string) => d.catalog.items.find((i) => i.id === id)!;
const ids = (d: AdminData, b: string, cat: string) => d.menus[b].items.filter((e) => item(d, e.id)?.category === cat).map((e) => e.id);

describe('parsePrice', () => {
  it.each([
    ['5,80', 5.8],
    ['5.8', 5.8],
    [' 12 ', 12],
    ['0.5', 0.5],
    [7.4, 7.4],
  ])('%s → %s', (input, out) => expect(parsePrice(input)).toBe(out));
  it.each(['', '0', '-1', 'abc', '5.805', '5,8,0', '1e3'])('rejects %j', (input) => expect(parsePrice(input)).toBeNull());
});

describe('price helpers', () => {
  it('flags >50% changes as suspicious', () => {
    expect(isSuspiciousChange(5.8, 58)).toBe(true);
    expect(isSuspiciousChange(5.8, 2.5)).toBe(true);
    expect(isSuspiciousChange(5.8, 6.2)).toBe(false);
  });
  it('bulk amount / percent / rounding', () => {
    expect(applyBulk(3.6, { mode: 'amount', value: 0.5 })).toBe(4.1);
    expect(applyBulk(3.6, { mode: 'percent', value: 10 })).toBe(3.96);
    expect(applyBulk(3.6, { mode: 'percent', value: 10, roundTo10: true })).toBe(4);
    expect(applyBulk(4.18, { mode: 'amount', value: -0.3 })).toBe(3.88);
  });
});

describe('slugify / uniqueId', () => {
  it.each([
    ['Çizburger', 'cizburger'],
    ['Səhər dəsti (2 nəfərlik)', 'seher-desti-2-neferlik'],
    ['İnegöl köftə', 'inegol-kofte'],
    ['Şaurma  Ət!!', 'saurma-et'],
    ['Soğan halqaları', 'sogan-halqalari'],
  ])('%s → %s', (a, b) => expect(slugify(a)).toBe(b));
  it('never reuses an id', () => {
    const taken = new Set(['cizburger', 'cizburger-2']);
    expect(uniqueId('Çizburger', taken)).toBe('cizburger-3');
    expect(uniqueId('!!!', new Set())).toBe('mehsul');
  });
  it('search ignores Azerbaijani letters and case', () => {
    expect(searchNorm('ÇİZBURGER')).toBe(searchNorm('cizburger'));
  });
});

describe('validation', () => {
  it('the current data is valid', () => expect(validateData(data)).toEqual([]));
  const base = item(data, 'ciz-burger');
  it('catalog: AZ name, category, photo path', () => {
    expect(validateItem({ ...base, name: { az: ' ' } }, cats).name).toBeTruthy();
    expect(validateItem({ ...base, category: 'nope' }, cats).category).toBeTruthy();
    expect(validateItem({ ...base, image: 'https://evil/x.png' }, cats).image).toBeTruthy();
  });
  it('branch price line: real price, old price above it', () => {
    expect(validateEntry({ price: 0 }).price).toBeTruthy();
    expect(validateEntry({ price: 5.805 }).price).toBeTruthy();
    expect(validateEntry({ price: 5.8, oldPrice: 5.8 }).oldPrice).toBeTruthy();
    expect(validateEntry({ price: 5.8, oldPrice: 6.5 })).toEqual({});
  });
  it('catches broken data the browser might send', () => {
    const bad = (patch: Partial<AdminData>) => validateData({ ...data, ...patch });
    expect(bad({ menus: { ...data.menus, gunesli: { items: [...data.menus.gunesli.items, { id: 'ghost', price: 1, available: true }] } } })[0]).toContain('kataloqda olmayan');
    expect(bad({ menus: { ...data.menus, gunesli: { items: [...data.menus.gunesli.items, data.menus.gunesli.items[0]] } } })[0]).toContain('iki dəfə');
    expect(bad({ menus: { gunesli: data.menus.gunesli } })[0]).toContain('filial siyahısına uyğun deyil');
    expect(bad({ catalog: { ...data.catalog, items: [...data.catalog.items, { ...base }] } })[0]).toContain('eyni id');
    expect(bad({ catalog: { ...data.catalog, items: [{ ...base, id: '../x' }] } })[0]).toContain('id');
    expect(validateData(null)).toEqual(['Menyu formatı düzgün deyil.']);
  });
  it('warns about duplicate names in one category', () => {
    expect(duplicateName({ ...base, id: 'x' }, data.catalog.items)).toBe(true);
    expect(duplicateName({ ...base, id: 'x', category: 'grill' }, data.catalog.items)).toBe(false);
  });
});

describe('ops', () => {
  it('new product: unique id, sold only where asked, at the end of its category', () => {
    const { data: d, id } = addProduct(data, { category: 'lahmacun', name: { az: 'Sadə' }, description: '', tags: [] }, { narimanov: { price: 3, available: true }, '4-mkr': { price: 2.8, available: true } });
    expect(id).toBe('sade');
    expect(ids(d, 'narimanov', 'lahmacun').at(-1)).toBe('sade');
    expect(entry(d, '4-mkr', 'sade')?.price).toBe(2.8);
    expect(entry(d, 'gunesli', 'sade')).toBeUndefined();
    expect(soldAt(d, 'sade')).toEqual(['narimanov', '4-mkr']);
    expect(validateData(d)).toEqual([]);
  });
  it('price and "bitib" change one branch only', () => {
    const d = updateEntry(updateEntry(data, 'narimanov', 'ciz-burger', { price: 6.2 }), 'narimanov', 'kola-05', { available: false });
    expect(entry(d, 'narimanov', 'ciz-burger')?.price).toBe(6.2);
    expect(entry(d, 'gunesli', 'ciz-burger')?.price).toBe(5.8);
    expect(entry(d, 'narimanov', 'kola-05')?.available).toBe(false);
    expect(entry(d, 'gunesli', 'kola-05')?.available).toBe(true);
  });
  it('clearing old price / own description removes the key', () => {
    let d = updateEntry(data, '4-mkr', 'super-set', { oldPrice: undefined });
    expect('oldPrice' in entry(d, '4-mkr', 'super-set')!).toBe(false);
    d = updateEntry(d, '4-mkr', 'ciz-burger', { description: undefined });
    expect('description' in entry(d, '4-mkr', 'ciz-burger')!).toBe(false);
  });
  it('catalog edits apply everywhere; an existing id never changes', () => {
    const d = updateCatalogItem(data, 'ciz-burger', { name: { az: 'Yeni ad' } });
    expect(item(d, 'ciz-burger').name.az).toBe('Yeni ad');
    expect(d.menus).toBe(data.menus);
  });
  it('moving to another category puts it at the end of that category in every branch', () => {
    const d = updateCatalogItem(data, 'ciz-burger', { category: 'burgers' });
    for (const b of ['gunesli', 'narimanov', '4-mkr']) expect(ids(d, b, 'burgers').at(-1)).toBe('ciz-burger');
  });
  it('"not sold here" vs delete everywhere', () => {
    const off = setSold(data, 'narimanov', 'ciz-burger', null);
    expect(entry(off, 'narimanov', 'ciz-burger')).toBeUndefined();
    expect(item(off, 'ciz-burger')).toBeTruthy();
    expect(entry(off, 'gunesli', 'ciz-burger')).toBeTruthy();
    // back on: lands at the end of its category
    const on = setSold(off, 'narimanov', 'ciz-burger', { price: 5.9, available: true });
    expect(ids(on, 'narimanov', 'signature').at(-1)).toBe('ciz-burger');

    expect(usedInCombos(data, 'ciz-burger').map((c) => c.id)).toEqual(['burgerci-et', 'mix-menyu']);
    const gone = deleteProducts(data, ['ciz-burger']);
    expect(JSON.stringify(gone)).not.toContain('"ciz-burger"');
    expect(item(gone, 'burgerci-et').includes).toHaveLength(2); // the empty burger slot is dropped
    expect(validateData(gone)).toEqual([]);
  });
  it('a category new to a branch keeps the catalog’s category order', () => {
    const d = setSold(data, '4-mkr', 'latte', { price: 5, available: true });
    const order = d.menus['4-mkr'].items.map((e) => item(d, e.id).category);
    expect(order.indexOf('coffee')).toBeGreaterThan(order.lastIndexOf('drinks'));
  });
  it('duplicate copies the catalog item and every branch price', () => {
    const { data: d, id } = duplicateProduct(data, 'ciz-burger');
    expect(item(d, id).name.az).toBe('Çizburger (kopya)');
    expect(soldAt(d, id)).toEqual(['gunesli', 'narimanov', '4-mkr']);
    expect(entry(d, '4-mkr', id)?.description).toBe(entry(data, '4-mkr', 'ciz-burger')?.description);
  });
  it('move and drag-and-drop stay inside the category of one branch', () => {
    expect(ids(moveEntry(data, 'gunesli', 'lahmacun-pendirli', -1), 'gunesli', 'lahmacun')).toEqual(['lahmacun-pendirli', 'lahmacun-sade', 'lahmacun-qarisiq']);
    expect(ids(moveEntry(data, 'gunesli', 'lahmacun-sade', -1), 'gunesli', 'lahmacun')).toEqual(ids(data, 'gunesli', 'lahmacun'));
    expect(ids(placeEntry(data, 'gunesli', 'lahmacun-qarisiq', 'lahmacun-sade'), 'gunesli', 'lahmacun')).toEqual(['lahmacun-qarisiq', 'lahmacun-sade', 'lahmacun-pendirli']);
    expect(ids(moveEntry(data, 'gunesli', 'lahmacun-pendirli', -1), 'narimanov', 'lahmacun')).toEqual(ids(data, 'narimanov', 'lahmacun'));
  });
  it('bulk preview per branch, flagging broken discounts', () => {
    const p = previewBulk(data, ['gunesli', '4-mkr'], ['burgerci-et', 'lahmacun-sade', 'latte'], { mode: 'amount', value: 2 });
    expect(p.map((r) => `${r.branch}:${r.id}`)).toEqual(['gunesli:lahmacun-sade', 'gunesli:burgerci-et', 'gunesli:latte', '4-mkr:lahmacun-sade', '4-mkr:burgerci-et']);
    expect(p.find((r) => r.branch === '4-mkr' && r.id === 'burgerci-et')!.problem).toMatch(/Köhnə qiymət/);
    const d = applyBulkPrices(data, p.filter((r) => !r.problem));
    expect(entry(d, '4-mkr', 'lahmacun-sade')?.price).toBe(5.6);
    expect(entry(d, 'narimanov', 'lahmacun-sade')?.price).toBe(3.6);
  });
});

describe('diff / commit message', () => {
  it('names the branch for branch changes, not for shared ones', () => {
    let d = updateEntry(data, 'narimanov', 'ciz-burger', { price: 6.2 });
    d = updateEntry(d, '4-mkr', 'kola-05', { available: false });
    d = addProduct(d, { category: 'fastfood', name: { az: 'Kartof dilimləri' }, description: '', tags: [] }, { gunesli: { price: 4.5, available: true } }).data;
    d = deleteProducts(d, ['duyu']);
    d = setSold(d, 'narimanov', 'sirab', { price: 2.5, available: true });
    expect(diffData(data, d)).toEqual([
      'yeni: Kartof dilimləri',
      'silindi: Düyü',
      'Günəşli: əlavə olundu: Kartof dilimləri 4.50',
      'Nərimanov: Çizburger 5.80→6.20',
      'Nərimanov: əlavə olundu: Sirab 2.50',
      '4-cü mikrorayon: Kola 0.5 bitib',
    ]);
    expect(commitMessage(['Nərimanov: Çizburger 5.80→6.20'])).toBe('Admin: Nərimanov: Çizburger 5.80→6.20');
  });
  it('removed from a branch, own ingredients, order, discount', () => {
    let d = setSold(data, '4-mkr', 'bingo-burger', null);
    d = updateEntry(d, 'gunesli', 'ciz-burger', { description: 'Xüsusi' });
    d = moveEntry(d, 'gunesli', 'lahmacun-pendirli', -1);
    d = updateEntry(d, '4-mkr', 'super-set', { oldPrice: undefined });
    expect(diffData(data, d)).toEqual([
      'Günəşli: Çizburger tərkibi dəyişdi',
      'Günəşli: Lahmacun sıralaması dəyişdi',
      '4-cü mikrorayon: Super Set endirim silindi',
      '4-cü mikrorayon: çıxarıldı: Bingo burger',
    ]);
  });
  it('branch info and settings', () => {
    const d: AdminData = {
      ...data,
      branches: { branches: data.branches.branches.map((b) => (b.id === 'narimanov' ? { ...b, geo: { lat: 40.4, lng: 49.87 } } : b)) },
      settings: { ...data.settings, social: { ...data.settings.social, instagram: 'https://instagram.com/danaburger' } },
    };
    expect(diffData(data, d)).toEqual(['Nərimanov: xəritə koordinatı yeniləndi', 'Ayarlar: Instagram yeniləndi']);
  });
  it('long lists are summarised in the subject line', () => {
    const msg = commitMessage(Array.from({ length: 9 }, (_, i) => `x${i}`));
    expect(msg.split('\n')[0]).toBe('Admin: x0; x1; x2; x3; +5 dəyişiklik');
    expect(msg).toContain('- x8');
  });
});

describe('branch settings', () => {
  it.each([
    ['050 123 45 67', '+994501234567'],
    ['+994 50 123 45 67', '+994501234567'],
    ['010 343 14 13', '+994103431413'],
    ['', ''],
  ])('normalizePhone(%j)', (a, b) => expect(normalizePhone(a)).toBe(b));
  it.each([
    ['40.374861, 49.977472', { lat: 40.374861, lng: 49.977472 }],
    ['https://www.google.com/maps/@40.4093,49.8671,15z', { lat: 40.4093, lng: 49.8671 }],
    ['nope', null],
  ])('parseGeo(%j)', (a, b) => expect(parseGeo(a)).toEqual(b));
  it('validates a branch', () => {
    const b = data.branches.branches[1];
    expect(validateBranchInfo(b)).toEqual({});
    expect(Object.keys(validateBranchInfo({ ...b, phone: '123', geo: { lat: 99, lng: 0 }, hours: { open: '25:00', close: '05:00' } })).sort()).toEqual(['geo', 'hours', 'phone']);
  });
  it('validates global settings', () => {
    expect(validateSettings(data.settings)).toEqual({});
    const bad = validateSettings({ ...data.settings, social: { ...data.settings.social, instagram: 'instagram.com/x' }, analytics: { ga4Id: 'UA-1', metaPixelId: 'abc' } });
    expect(Object.keys(bad).sort()).toEqual(['ga4Id', 'instagram', 'metaPixelId']);
  });
});
