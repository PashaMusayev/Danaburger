import type { BranchEntry, BranchMenuFile, Catalog, CatalogItem } from '../menu';

// data/menu.json and data/branches/*.json keep one item per line so git diffs show exactly what the owner changed.
// This reproduces the file's existing style byte for byte: ", " / ": " separators, non-ASCII kept,
// and prices always written with a decimal point (3.0, not 3).
const FLOAT_KEYS = new Set(['price', 'oldPrice']);

function dump(v: unknown, key?: string): string {
  if (Array.isArray(v)) return `[${v.map((x) => dump(x)).join(', ')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.entries(v as Record<string, unknown>)
      .filter(([, x]) => x !== undefined)
      .map(([k, x]) => `${JSON.stringify(k)}: ${dump(x, k)}`)
      .join(', ')}}`;
  }
  if (typeof v === 'number') return FLOAT_KEYS.has(key ?? '') && Number.isInteger(v) ? `${v}.0` : String(v);
  return JSON.stringify(v);
}

/** Stable key order for catalog items created or edited in the panel. */
export function canonicalItem(i: CatalogItem): CatalogItem {
  const l10n = (x: { az: string; ru?: string; en?: string }) => ({ az: x.az, ru: x.ru ?? '', en: x.en ?? '' });
  return {
    id: i.id,
    category: i.category,
    ...(i.group && { group: l10n(i.group) }),
    name: l10n(i.name),
    description: i.description,
    ...(i.image && { image: i.image }),
    tags: i.tags,
    ...(i.includes?.length && { includes: i.includes.map((s) => ({ anyOf: s.anyOf, qty: s.qty })) }),
  };
}

export function canonicalEntry(e: BranchEntry): BranchEntry {
  return {
    id: e.id,
    price: e.price,
    ...(e.oldPrice !== undefined && { oldPrice: e.oldPrice }),
    available: e.available,
    ...(e.description !== undefined && { description: e.description }),
  };
}

const list = (xs: unknown[]) => xs.map((x, i) => `    ${dump(x)}${i < xs.length - 1 ? ',' : ''}`);

export function formatCatalog(m: Catalog): string {
  return [
    '{',
    `  "currency": ${JSON.stringify(m.currency)},`,
    '  "categories": [',
    ...list(m.categories),
    '  ],',
    '  "items": [',
    ...list(m.items),
    '  ]',
    '}',
    '',
  ].join('\n');
}

/** data/branches/<id>.json: one item per line, like the catalog. */
export function formatBranchMenu(m: BranchMenuFile): string {
  return ['{', '  "items": [', ...list(m.items), '  ]', '}', ''].join('\n');
}

/** settings.json and branches.json: plain 2-space JSON. */
export const formatJson = (s: unknown) => JSON.stringify(s, null, 2) + '\n';
