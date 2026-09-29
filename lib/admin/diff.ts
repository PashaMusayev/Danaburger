import type { BranchInfo, BranchMenuFile, Catalog, CatalogItem } from '../menu';
import { canonicalItem } from './format';
import { branchName, type AdminData } from './model';

const money = (n: number) => n.toFixed(2);
const label = (i: CatalogItem) => (i.group ? `${i.name.az} (${i.group.az})` : i.name.az);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Changes to shared product data: they apply to every branch, so no branch prefix. */
export function diffCatalog(before: Catalog, after: Catalog): string[] {
  const out: string[] = [];
  const old = new Map(before.items.map((i) => [i.id, i]));
  const now = new Map(after.items.map((i) => [i.id, i]));
  for (const i of after.items) {
    const o = old.get(i.id);
    if (!o) {
      out.push(`yeni: ${label(i)}`);
      continue;
    }
    const { includes: a, ...ra } = canonicalItem(o);
    const { includes: b, ...rb } = canonicalItem(i);
    if (!same(ra, rb)) out.push(`${label(i)} redaktə olundu`);
    else if (!same(a ?? [], b ?? [])) out.push(`${label(i)} set tərkibi yeniləndi`);
  }
  for (const o of before.items) if (!now.has(o.id)) out.push(`silindi: ${label(o)}`);
  return out;
}

/** One branch's menu: prices, "bitib", added/removed, own ingredients, order. Prefixed with the branch name. */
export function diffBranchMenu(bn: string, catalog: Catalog, before: BranchMenuFile, after: BranchMenuFile, deleted: Set<string> = new Set()): string[] {
  const out: string[] = [];
  const cat = new Map(catalog.items.map((i) => [i.id, i]));
  const name = (id: string) => (cat.get(id) ? label(cat.get(id)!) : id);
  const old = new Map(before.items.map((e) => [e.id, e]));
  const now = new Map(after.items.map((e) => [e.id, e]));
  for (const e of after.items) {
    const o = old.get(e.id);
    if (!o) {
      out.push(`${bn}: əlavə olundu: ${name(e.id)} ${money(e.price)}`);
      continue;
    }
    const n = name(e.id);
    if (o.price !== e.price) out.push(`${bn}: ${n} ${money(o.price)}→${money(e.price)}`);
    if (o.oldPrice !== e.oldPrice) {
      out.push(
        e.oldPrice === undefined
          ? `${bn}: ${n} endirim silindi`
          : `${bn}: ${n} köhnə qiymət ${o.oldPrice === undefined ? '' : money(o.oldPrice) + '→'}${money(e.oldPrice)}`,
      );
    }
    if (o.available !== e.available) out.push(`${bn}: ${n} ${e.available ? 'yenidən mövcuddur' : 'bitib'}`);
    if (o.description !== e.description) out.push(`${bn}: ${n} tərkibi dəyişdi`);
  }
  // deleted from the catalog is already reported once ("silindi: X"), not once per branch
  for (const o of before.items) if (!now.has(o.id) && !deleted.has(o.id)) out.push(`${bn}: çıxarıldı: ${name(o.id)}`);

  const kept = (m: BranchMenuFile) => m.items.filter((e) => old.has(e.id) && now.has(e.id));
  const order = (m: BranchMenuFile) =>
    catalog.categories.map((c) =>
      kept(m)
        .filter((e) => cat.get(e.id)?.category === c.id)
        .map((e) => e.id)
        .join(','),
    );
  const ob = order(before);
  const oa = order(after);
  catalog.categories.forEach((c, i) => {
    if (ob[i] !== oa[i]) out.push(`${bn}: ${c.name.az} sıralaması dəyişdi`);
  });
  return out;
}

const FIELD: Record<string, string> = {
  phone: 'telefon', whatsapp: 'WhatsApp', address: 'ünvan', geo: 'xəritə koordinatı', hours: 'iş saatları', name: 'ad',
  instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', wolt: 'Wolt', bolt: 'Bolt', ga4Id: 'GA4 ID', metaPixelId: 'Meta Pixel ID',
};

export function diffBranchInfo(before: BranchInfo[], after: BranchInfo[]): string[] {
  const out: string[] = [];
  for (const b of after) {
    const o = before.find((x) => x.id === b.id);
    if (!o) continue;
    for (const k of ['name', 'address', 'phone', 'whatsapp', 'geo', 'hours'] as const) {
      if (!same(o[k], b[k])) out.push(`${o.name.az}: ${FIELD[k]} ${b[k] ? 'yeniləndi' : 'silindi'}`);
    }
  }
  return out;
}

export function diffSettings(before: Record<string, unknown>, after: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = [];
  for (const k of new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])) {
    const a = before?.[k];
    const b = after?.[k];
    if (a && typeof a === 'object') out.push(...diffSettings(a as Record<string, unknown>, (b ?? {}) as Record<string, unknown>, prefix + k + '.'));
    else if (a !== b) out.push(`Ayarlar: ${FIELD[k] ?? prefix + k} ${b ? 'yeniləndi' : 'silindi'}`);
  }
  return out;
}

/**
 * Everything that changed, in words the owner uses:
 * ["Nərimanov: Çizburger 5.80→6.20", "4-cü mikrorayon: Kola 0.5 bitib", "yeni: Kartof dilimləri", …].
 * Shown in the "N dəyişiklik" bar and used as the commit message (recomputed on the server).
 */
export function diffData(before: AdminData, after: AdminData): string[] {
  const deleted = new Set(before.catalog.items.map((i) => i.id).filter((id) => !after.catalog.items.some((i) => i.id === id)));
  const out = diffCatalog(before.catalog, after.catalog);
  for (const b of after.branches.branches) {
    const bm = before.menus[b.id];
    const am = after.menus[b.id];
    // names come from whichever catalog still has the item
    const cat = { ...after.catalog, items: [...after.catalog.items, ...before.catalog.items.filter((i) => deleted.has(i.id))] };
    if (bm && am) out.push(...diffBranchMenu(branchName(after, b.id), cat, bm, am, deleted));
  }
  out.push(...diffBranchInfo(before.branches.branches, after.branches.branches));
  out.push(...diffSettings(before.settings, after.settings));
  return out;
}

/** Commit subject stays short; the full list goes into the body. */
export function commitMessage(changes: string[]): string {
  const subject = `Admin: ${changes.slice(0, 4).join('; ')}${changes.length > 4 ? `; +${changes.length - 4} dəyişiklik` : ''}`;
  const clipped = subject.length > 180 ? subject.slice(0, 177) + '...' : subject;
  return changes.length > 1 ? `${clipped}\n\n${changes.map((c) => `- ${c}`).join('\n')}\n` : clipped;
}

