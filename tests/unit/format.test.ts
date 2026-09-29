import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { canonicalEntry, canonicalItem, formatBranchMenu, formatCatalog, formatJson } from '@/lib/admin/format';
import type { BranchMenuFile, Catalog } from '@/lib/menu';

const read = (p: string) => readFileSync(p, 'utf8');
const catalogText = read('data/menu.json');
const catalog = JSON.parse(catalogText) as Catalog;
const branchFiles = readdirSync('data/branches').map((f) => `data/branches/${f}`);

describe('file formats round-trip byte for byte (clean git diffs)', () => {
  it('catalog', () => expect(formatCatalog(catalog)).toBe(catalogText));
  it.each(branchFiles)('%s', (p) => expect(formatBranchMenu(JSON.parse(read(p)))).toBe(read(p)));
  it.each(['data/settings.json', 'data/branches.json'])('%s', (p) => expect(formatJson(JSON.parse(read(p)))).toBe(read(p)));

  it('one item per line', () => {
    expect(catalogText.split('\n').filter((l) => l.startsWith('    {"id": ') && l.includes('"tags"'))).toHaveLength(catalog.items.length);
    for (const p of branchFiles) {
      const m = JSON.parse(read(p)) as BranchMenuFile;
      expect(read(p).split('\n').filter((l) => l.startsWith('    {"id": '))).toHaveLength(m.items.length);
    }
  });

  it('whole prices keep a decimal point, qty stays an integer', () => {
    expect(formatBranchMenu({ items: [{ id: 'x', price: 12, oldPrice: 15, available: true }] })).toContain('{"id": "x", "price": 12.0, "oldPrice": 15.0, "available": true}');
    expect(formatCatalog({ ...catalog, items: [{ ...catalog.items[0], includes: [{ anyOf: ['x'], qty: 2 }] }] })).toContain('"qty": 2}');
  });

  it('canonical key order is a no-op for existing data', () => {
    for (const i of catalog.items) expect(JSON.stringify(canonicalItem(i))).toBe(JSON.stringify(i));
    for (const p of branchFiles) for (const e of (JSON.parse(read(p)) as BranchMenuFile).items) expect(JSON.stringify(canonicalEntry(e))).toBe(JSON.stringify(e));
  });
});
