import type { MenuData, RawMenuItem } from '../menu';

// data/menu.json keeps one item per line so git diffs show exactly what the owner changed.
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

/** Stable key order for items created or edited in the panel. */
export function canonicalItem(i: RawMenuItem): RawMenuItem {
  const l10n = (x: { az: string; ru?: string; en?: string }) => ({ az: x.az, ru: x.ru ?? '', en: x.en ?? '' });
  return {
    id: i.id,
    category: i.category,
    ...(i.group && { group: l10n(i.group) }),
    name: l10n(i.name),
    description: i.description,
    price: i.price,
    ...(i.oldPrice !== undefined && { oldPrice: i.oldPrice }),
    ...(i.image && { image: i.image }),
    tags: i.tags,
    available: i.available,
    ...(i.includes?.length && { includes: i.includes.map((s) => ({ anyOf: s.anyOf, qty: s.qty })) }),
  };
}

export function formatMenu(m: MenuData): string {
  const list = (xs: unknown[]) => xs.map((x, i) => `    ${dump(x)}${i < xs.length - 1 ? ',' : ''}`);
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

export const formatSettings = (s: unknown) => JSON.stringify(s, null, 2) + '\n';
