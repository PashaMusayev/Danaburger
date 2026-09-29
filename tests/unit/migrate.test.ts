import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isLegacyMenu, splitLegacyMenu, type LegacyMenu } from '@/lib/admin/migrate';
import { formatBranchMenu } from '@/lib/admin/format';
import { buildBranchMenu, type Catalog } from '@/lib/menu';

// data/menu.json exactly as it was before branches (Günəşli's menu, prices inside each item)
const legacy = JSON.parse(readFileSync('tests/fixtures/menu-before-branches.json', 'utf8')) as LegacyMenu;
const catalog = JSON.parse(readFileSync('data/menu.json', 'utf8')) as Catalog;
const gunesliText = readFileSync('data/branches/gunesli.json', 'utf8');

describe('migration to branches', () => {
  it('recognises the old format and not the new one', () => {
    expect(isLegacyMenu(legacy)).toBe(true);
    expect(isLegacyMenu(catalog)).toBe(false);
  });

  it('produces data/branches/gunesli.json byte for byte', () => {
    expect(formatBranchMenu(splitLegacyMenu(legacy).branch)).toBe(gunesliText);
  });

  it('every old item is in the catalog unchanged (only new products were added since)', () => {
    const split = splitLegacyMenu(legacy).catalog;
    const now = new Map(catalog.items.map((i) => [i.id, i]));
    for (const i of split.items) expect(now.get(i.id)).toEqual(i);
    expect(catalog.categories).toEqual(legacy.categories);
  });

  it('the Günəşli site shows exactly the old prices, names and ingredients', () => {
    const site = buildBranchMenu(catalog, JSON.parse(gunesliText));
    const old = legacy.items.filter((i) => i.available);
    expect(site.items.map((i) => i.id)).toEqual(old.map((i) => i.id));
    for (const [n, i] of site.items.entries()) {
      const o = old[n];
      expect([i.price, i.oldPrice, i.name.az, i.description, i.image, i.category]).toEqual([o.price, o.oldPrice, o.name.az, o.description, o.image, o.category]);
    }
  });
});
