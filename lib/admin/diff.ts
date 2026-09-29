import type { MenuData, RawMenuItem } from '../menu';
import { canonicalItem } from './format';

const money = (n: number) => n.toFixed(2);
const label = (i: RawMenuItem) => (i.group ? `${i.name.az} (${i.group.az})` : i.name.az);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Human-readable list of what changed, e.g. ["Çizburger 5.80→6.20", "Kola 0.5 bitib", "yeni: Kartof dilimləri"].
 * Used for the "3 dəyişiklik" bar and as the commit message (computed again on the server).
 */
export function diffMenu(before: MenuData, after: MenuData): string[] {
  const out: string[] = [];
  const old = new Map(before.items.map((i) => [i.id, i]));
  const now = new Map(after.items.map((i) => [i.id, i]));

  for (const i of after.items) {
    const o = old.get(i.id);
    if (!o) {
      out.push(`yeni: ${label(i)}`);
      continue;
    }
    if (o.price !== i.price) out.push(`${label(i)} ${money(o.price)}→${money(i.price)}`);
    if (o.oldPrice !== i.oldPrice) {
      out.push(
        i.oldPrice === undefined
          ? `${label(i)} endirim silindi`
          : `${label(i)} köhnə qiymət ${o.oldPrice === undefined ? '' : money(o.oldPrice) + '→'}${money(i.oldPrice)}`,
      );
    }
    if (o.available !== i.available) out.push(`${label(i)} ${i.available ? 'yenidən mövcuddur' : 'bitib'}`);
    const rest = (x: RawMenuItem) => {
      const { price, oldPrice, available, includes, ...r } = canonicalItem(x);
      void price, oldPrice, available, includes;
      return r;
    };
    if (!same(rest(o), rest(i))) out.push(`${label(i)} redaktə olundu`);
    else if (!same(o.includes ?? [], i.includes ?? [])) out.push(`${label(i)} set tərkibi yeniləndi`);
  }
  for (const o of before.items) if (!now.has(o.id)) out.push(`silindi: ${label(o)}`);

  // order within each category
  const order = (m: MenuData) => m.categories.map((c) => m.items.filter((i) => i.category === c.id && old.has(i.id) && now.has(i.id)).map((i) => i.id).join(','));
  const ob = order(before);
  const oa = order(after);
  after.categories.forEach((c, n) => {
    if (ob[n] !== oa[n]) out.push(`${c.name.az}: sıralama dəyişdi`);
  });
  return out;
}

export function diffSettings(before: Record<string, unknown>, after: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = [];
  const names: Record<string, string> = {
    phone: 'Telefon', whatsapp: 'WhatsApp', instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook',
    wolt: 'Wolt', bolt: 'Bolt', ga4Id: 'GA4 ID', metaPixelId: 'Meta Pixel ID',
  };
  for (const k of new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])) {
    const a = before?.[k];
    const b = after?.[k];
    if (a && typeof a === 'object') out.push(...diffSettings(a as Record<string, unknown>, (b ?? {}) as Record<string, unknown>, prefix + k + '.'));
    else if (a !== b) out.push(`Ayarlar: ${names[k] ?? prefix + k} ${b ? 'yeniləndi' : 'silindi'}`);
  }
  return out;
}

/** Commit subject stays short; the full list goes into the body. */
export function commitMessage(changes: string[]): string {
  const subject = `Admin: ${changes.slice(0, 4).join('; ')}${changes.length > 4 ? `; +${changes.length - 4} dəyişiklik` : ''}`;
  const clipped = subject.length > 180 ? subject.slice(0, 177) + '...' : subject;
  return changes.length > 1 ? `${clipped}\n\n${changes.map((c) => `- ${c}`).join('\n')}\n` : clipped;
}
