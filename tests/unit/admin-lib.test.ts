import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { MenuData, RawMenuItem } from '@/lib/menu';
import { applyBulk, isSuspiciousChange, parsePrice } from '@/lib/admin/price';
import { searchNorm, slugify, uniqueId } from '@/lib/admin/slug';
import { duplicateName, validateItem, validateMenu } from '@/lib/admin/validate';
import { commitMessage, diffMenu, diffSettings } from '@/lib/admin/diff';
import { addItem, deleteItems, moveItem, placeItem, previewBulk, updateItem, usedInCombos } from '@/lib/admin/ops';
import { normalizePhone, validateSettings } from '@/lib/admin/settings';
import settings from '@/data/settings.json';

const menu = JSON.parse(readFileSync('data/menu.json', 'utf8')) as MenuData;
const cats = new Set(menu.categories.map((c) => c.id));
const byId = (m: MenuData, id: string) => m.items.find((i) => i.id === id)!;

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
  it('the current menu is valid', () => expect(validateMenu(menu)).toEqual([]));
  const base = byId(menu, 'ciz-burger');
  it('requires an AZ name and a real price', () => {
    expect(validateItem({ ...base, name: { az: ' ' } }, cats).name).toBeTruthy();
    expect(validateItem({ ...base, price: 0 }, cats).price).toBeTruthy();
    expect(validateItem({ ...base, price: 5.805 }, cats).price).toBeTruthy();
  });
  it('old price must be higher than the price', () => {
    expect(validateItem({ ...base, oldPrice: 5.8 }, cats).oldPrice).toBeTruthy();
    expect(validateItem({ ...base, oldPrice: 6.5 }, cats)).toEqual({});
  });
  it('catches broken whole-menu data the browser might send', () => {
    expect(validateMenu({ ...menu, items: [...menu.items, { ...base }] })[0]).toContain('eyni id');
    expect(validateMenu({ ...menu, items: [{ ...base, tags: ['bogus'] as unknown as RawMenuItem['tags'] }] })[0]).toContain('etiket');
    expect(validateMenu({ ...menu, items: [{ ...base, id: '../x' }] })[0]).toContain('id');
    expect(validateMenu({ ...menu, items: [{ ...base, image: 'https://evil/x.png' }] })[0]).toContain('Foto');
    expect(validateMenu(null)).toEqual(['Menyu formatı düzgün deyil.']);
  });
  it('warns about duplicate names in one category', () => {
    expect(duplicateName({ ...base, id: 'x' }, menu.items)).toBe(true);
    expect(duplicateName({ ...base, id: 'x', category: 'grill' }, menu.items)).toBe(false);
  });
});

describe('ops', () => {
  it('new items get a unique id and land at the end of their category', () => {
    const { menu: m, id } = addItem(menu, { category: 'lahmacun', name: { az: 'Sadə' }, description: '', price: 3, tags: [], available: true });
    expect(id).toBe('sade');
    const lah = m.items.filter((i) => i.category === 'lahmacun').map((i) => i.id);
    expect(lah.at(-1)).toBe('sade');
    expect(validateMenu(m)).toEqual([]);
  });
  it('an existing id never changes on edit', () => {
    const m = updateItem(menu, 'ciz-burger', { name: { az: 'Yeni ad' }, price: 6.2 });
    expect(byId(m, 'ciz-burger').name.az).toBe('Yeni ad');
  });
  it('moving to another category places the item at the end of it', () => {
    const m = updateItem(menu, 'ciz-burger', { category: 'burgers' });
    expect(m.items.filter((i) => i.category === 'burgers').at(-1)!.id).toBe('ciz-burger');
  });
  it('clearing old price / image / group removes the keys', () => {
    const m = updateItem(menu, 'super-set', { oldPrice: undefined });
    expect('oldPrice' in byId(m, 'super-set')).toBe(false);
  });
  it('delete removes the item and its references from combos', () => {
    expect(usedInCombos(menu, 'ciz-burger').map((c) => c.id)).toEqual(['burgerci-et', 'mix-menyu']);
    const m = deleteItems(menu, ['ciz-burger']);
    expect(m.items.some((i) => i.id === 'ciz-burger')).toBe(false);
    expect(JSON.stringify(m)).not.toContain('"ciz-burger"');
    expect(byId(m, 'burgerci-et').includes).toHaveLength(2); // the empty burger slot is dropped
    expect(validateMenu(m)).toEqual([]);
  });
  it('move and drag-and-drop stay inside the category', () => {
    const ids = (m: MenuData) => m.items.filter((i) => i.category === 'lahmacun').map((i) => i.id);
    expect(ids(moveItem(menu, 'lahmacun-pendirli', -1))).toEqual(['lahmacun-pendirli', 'lahmacun-sade', 'lahmacun-qarisiq']);
    expect(ids(moveItem(menu, 'lahmacun-sade', -1))).toEqual(ids(menu)); // already first
    expect(ids(placeItem(menu, 'lahmacun-qarisiq', 'lahmacun-sade'))).toEqual(['lahmacun-qarisiq', 'lahmacun-sade', 'lahmacun-pendirli']);
    expect(ids(placeItem(menu, 'lahmacun-sade', null))).toEqual(['lahmacun-pendirli', 'lahmacun-qarisiq', 'lahmacun-sade']);
  });
  it('bulk preview flags prices that would break a discount', () => {
    const p = previewBulk(menu, ['burgerci-et', 'lahmacun-sade'], { mode: 'amount', value: 2 });
    expect(p.find((x) => x.id === 'burgerci-et')!.problem).toMatch(/Köhnə qiymət/);
    expect(p.find((x) => x.id === 'lahmacun-sade')).toMatchObject({ from: 3.6, to: 5.6 });
  });
});

describe('diff / commit message', () => {
  it('describes changes the way the owner thinks about them', () => {
    let m = updateItem(menu, 'ciz-burger', { price: 6.2 });
    m = updateItem(m, 'kola-05', { available: false });
    m = addItem(m, { category: 'fastfood', name: { az: 'Kartof dilimləri' }, description: '', price: 4.5, tags: [], available: true }).menu;
    m = deleteItems(m, ['duyu']);
    // listed in menu order (Fast food comes before Drinks)
    expect(diffMenu(menu, m)).toEqual(['Çizburger 5.80→6.20', 'yeni: Kartof dilimləri', 'Kola 0.5 bitib', 'silindi: Düyü']);
    expect(commitMessage(diffMenu(menu, m)).split('\n')[0]).toBe('Admin: Çizburger 5.80→6.20; yeni: Kartof dilimləri; Kola 0.5 bitib; silindi: Düyü');
  });
  it('mentions reordering and group-qualified names', () => {
    expect(diffMenu(menu, moveItem(menu, 'lahmacun-pendirli', -1))).toEqual(['Lahmacun: sıralama dəyişdi']);
    expect(diffMenu(menu, updateItem(menu, 'saurma-et-durum', { price: 4.5 }))).toEqual(['Dürüm (Ət) 4.20→4.50']);
  });
  it('long lists are summarised in the subject line', () => {
    const msg = commitMessage(Array.from({ length: 9 }, (_, i) => `x${i}`));
    expect(msg.split('\n')[0]).toBe('Admin: x0; x1; x2; x3; +5 dəyişiklik');
    expect(msg).toContain('- x8');
  });
  it('settings diffs name the field', () => {
    expect(diffSettings(settings, { ...settings, phone: '+994501234567' })).toEqual(['Ayarlar: Telefon yeniləndi']);
  });
});

describe('settings', () => {
  it.each([
    ['050 123 45 67', '+994501234567'],
    ['+994 50 123 45 67', '+994501234567'],
    ['994501234567', '+994501234567'],
    ['', ''],
  ])('normalizePhone(%j)', (a, b) => expect(normalizePhone(a)).toBe(b));
  it('validates formats', () => {
    expect(validateSettings(settings)).toEqual({});
    const bad = validateSettings({ ...settings, phone: '12345', social: { ...settings.social, instagram: 'instagram.com/x' }, analytics: { ga4Id: 'UA-1', metaPixelId: 'abc' } });
    expect(Object.keys(bad).sort()).toEqual(['ga4Id', 'instagram', 'metaPixelId', 'phone']);
  });
});
