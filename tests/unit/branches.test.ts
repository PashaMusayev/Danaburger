import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildBranchMenu, type BranchMenuFile, type Catalog } from '@/lib/menu';
import { branches, getBranchMenu } from '@/lib/branches';
import { bestComboOffer, suggestDrinks, suggestSauces } from '@/lib/upsell';
import { validateData } from '@/lib/admin/validate';
import type { AdminData } from '@/lib/admin/model';

const json = <T,>(p: string) => JSON.parse(readFileSync(p, 'utf8')) as T;
const catalog = json<Catalog>('data/menu.json');
const data: AdminData = {
  catalog,
  branches: json('data/branches.json'),
  settings: json('data/settings.json'),
  menus: Object.fromEntries(branches.map((b) => [b.id, json<BranchMenuFile>(`data/branches/${b.id}.json`)])),
};
const price = (b: string, id: string) => getBranchMenu(b).itemById.get(id)?.price;
const old = (b: string, id: string) => getBranchMenu(b).itemById.get(id)?.oldPrice;

describe('the real data', () => {
  it('is valid', () => expect(validateData(data)).toEqual([]));
  it('has three branches with their phones', () => {
    expect(branches.map((b) => [b.id, b.phone])).toEqual([
      ['gunesli', '+994555660110'],
      ['narimanov', '+994555414848'],
      ['4-mkr', '+994103431413'],
    ]);
  });
  it('item counts per branch', () => {
    expect(data.menus.gunesli.items).toHaveLength(176);
    expect(data.menus.narimanov.items).toHaveLength(154);
    expect(data.menus['4-mkr'].items).toHaveLength(107);
  });
});

describe('Nərimanov differs from Günəşli exactly as its menu says', () => {
  it.each([
    ['saurma-et-corek', 4.2, 3.9],
    ['saurma-et-corek-double', 8.2, 7.5],
    ['saurma-et-durum', 4.4, 4.2],
    ['saurma-et-durum-double', 8.6, 7.9],
  ])('%s %s (Günəşli %s)', (id, n, g) => {
    expect(price('narimanov', id)).toBe(n);
    expect(price('gunesli', id)).toBe(g);
  });
  it('same price, different crossed-out price', () => {
    expect([old('narimanov', 'klassik-toyuq'), old('narimanov', 'klassik-et'), old('narimanov', 'gundelik')]).toEqual([9, 9.4, 9.1]);
    expect(price('narimanov', 'gundelik')).toBe(price('gunesli', 'gundelik'));
  });
  it('only-here and missing items', () => {
    expect(price('narimanov', 'toyuq-langet')).toBe(8.5);
    expect(price('narimanov', 'seher-yemeyi')).toBe(5.9);
    for (const id of ['mini-satobrian', 'sis-kofte', 'seher-1', 'haydari', 'xirt-xirt-badimcan', 'sirab', 'super-set', 'izmir-set']) expect(price('narimanov', id)).toBeUndefined();
    expect(price('narimanov', 'kasap-kofte')).toBe(9.8);
  });
  it('everything else matches Günəşli', () => {
    const g = new Map(data.menus.gunesli.items.map((e) => [e.id, e]));
    const special = new Set(['saurma-et-corek', 'saurma-et-corek-double', 'saurma-et-durum', 'saurma-et-durum-double', 'klassik-toyuq', 'klassik-et', 'gundelik', 'toyuq-langet', 'seher-yemeyi']);
    for (const e of data.menus.narimanov.items.filter((x) => !special.has(x.id))) expect(e).toEqual(g.get(e.id));
  });
});

describe('4-cü mikrorayon', () => {
  it.each([
    ['ciken-burger', 4.8],
    ['bingo-burger', 11],
    ['trio-burger', 15.9],
    ['burger-saurma-toyuq', 4.5],
    ['pide-sucuklu', 9],
    ['pizza-dana-burger', 15],
    ['mix-citir', 9.9],
    ['ayran', 1.2],
    ['kasap-kofte', 9.3],
    ['gunun-sorbasi', 3.5],
  ])('%s %s', (id, p) => expect(price('4-mkr', id)).toBe(p));
  it('sets keep the price but show this branch’s crossed-out price', () => {
    expect([price('4-mkr', 'super-set'), old('4-mkr', 'super-set')]).toEqual([36.5, 57]);
    expect([price('gunesli', 'super-set'), old('gunesli', 'super-set')]).toEqual([36.5, 64.4]);
    expect(old('4-mkr', 'boyuk-set')).toBeUndefined();
    expect(old('4-mkr', 'dana-burgerci')).toBeUndefined();
  });
  it('shows its own ingredients instead of the catalog’s', () => {
    expect(getBranchMenu('4-mkr').itemById.get('ciz-burger')!.description).toBe('Çəkilmiş ət 100 qr, pomidor, turşu xiyar, sous, aysberq, pendir');
    expect(getBranchMenu('gunesli').itemById.get('ciz-burger')!.description).toContain('karamel soğan');
  });
  it('sells no sauces, so nothing offers one', () => {
    const m = getBranchMenu('4-mkr');
    expect(m.sauces).toEqual([]);
    expect(m.itemById.has('qarisiq-tursu')).toBe(true); // pickles aren't a sauce
    expect(suggestSauces(m, [{ id: 'ciz-burger', qty: 1 }])).toEqual([]);
    expect(suggestSauces(getBranchMenu('gunesli'), [{ id: 'ciz-burger', qty: 1 }]).map((i) => i.id)).toEqual(['sous-pendirli', 'sous-sarimsaqli', 'sous-barbekyu']);
  });
});

describe('upsell uses the branch’s own menu and prices', () => {
  it('"setə keç" with this branch’s numbers', () => {
    // Günəşli: Çizburger 5.80 + Fri 4.00 = 9.80 vs Burgerçi Menyu 8.90 (with a cola)
    expect(bestComboOffer(getBranchMenu('gunesli'), [{ id: 'ciz-burger', qty: 1 }, { id: 'fri', qty: 1 }])).toMatchObject({ kind: 'swap', combo: { id: 'burgerci-et' } });
    // 4-cü mkr: Çizburger 5.20 + Fri 4.00 = 9.20 vs 8.90
    const o = bestComboOffer(getBranchMenu('4-mkr'), [{ id: 'ciz-burger', qty: 1 }, { id: 'fri', qty: 1 }]);
    expect(o?.kind === 'swap' && Math.round(o.save * 100) / 100).toBe(0.3);
  });
  it('never offers a combo the branch can’t complete', () => {
    const c: Catalog = { ...catalog };
    const m = buildBranchMenu(c, { items: [{ id: 'ciz-burger', price: 5.8, available: true }, { id: 'fri', price: 4, available: true }, { id: 'burgerci-et', price: 8.9, available: true }] });
    // no cola on sale here → Burgerçi Menyu can't be completed and isn't offered
    expect(m.combos).toEqual([]);
    expect(bestComboOffer(m, [{ id: 'ciz-burger', qty: 1 }, { id: 'fri', qty: 1 }])).toBeNull();
  });
  it('"bitib" items disappear from the site and from offers', () => {
    const m = buildBranchMenu(catalog, { items: [{ id: 'ciz-burger', price: 5.8, available: false }, { id: 'kola-05', price: 2.5, available: true }] });
    expect(m.itemById.has('ciz-burger')).toBe(false);
    expect(suggestDrinks(m, [{ id: 'ciz-burger', qty: 1 }])).toEqual([]);
  });
  it('empty RU/EN names fall back to AZ', () => {
    const c: Catalog = { ...catalog, items: [...catalog.items, { id: 'yeni', category: 'fastfood', name: { az: 'Yeni məhsul', ru: '', en: '' }, description: '', tags: [] }] };
    expect(buildBranchMenu(c, { items: [{ id: 'yeni', price: 3, available: true }] }).itemById.get('yeni')!.name).toEqual({ az: 'Yeni məhsul', ru: 'Yeni məhsul', en: 'Yeni məhsul' });
  });
});
