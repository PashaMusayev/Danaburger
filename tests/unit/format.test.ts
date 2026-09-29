import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { canonicalItem, formatMenu, formatSettings } from '@/lib/admin/format';
import type { MenuData } from '@/lib/menu';

const file = readFileSync('data/menu.json', 'utf8');
const menu = JSON.parse(file) as MenuData;

describe('formatMenu', () => {
  it('reproduces the current data/menu.json byte for byte', () => {
    expect(formatMenu(menu)).toBe(file);
  });

  it('keeps one item per line', () => {
    const lines = formatMenu(menu).split('\n').filter((l) => l.includes('"id": ') && l.includes('"price"'));
    expect(lines).toHaveLength(menu.items.length);
  });

  it('writes whole prices with a decimal point and leaves qty as an integer', () => {
    const out = formatMenu({ ...menu, items: [{ ...menu.items[0], price: 12, oldPrice: 15, includes: [{ anyOf: ['x'], qty: 2 }] }] });
    expect(out).toContain('"price": 12.0');
    expect(out).toContain('"oldPrice": 15.0');
    expect(out).toContain('"qty": 2}');
  });

  it('canonicalItem is a no-op for existing items', () => {
    for (const i of menu.items) expect(JSON.stringify(canonicalItem(i))).toBe(JSON.stringify(i));
  });

  it('settings.json keeps its 2-space layout', () => {
    const s = readFileSync('data/settings.json', 'utf8');
    expect(formatSettings(JSON.parse(s))).toBe(s);
  });
});
