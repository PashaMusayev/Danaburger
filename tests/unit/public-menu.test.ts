import { describe, expect, it, vi } from 'vitest';
import type { MenuData } from '@/lib/menu';

// Simulate the owner marking Çizburger "bitib" and leaving RU/EN names empty for a new item.
vi.mock('@/data/menu.json', async (importOriginal) => {
  const m = structuredClone(((await importOriginal()) as { default: MenuData }).default);
  const ciz = m.items.find((i) => i.id === 'ciz-burger')!;
  ciz.available = false;
  m.items.push({ id: 'yeni', category: 'fastfood', name: { az: 'Yeni məhsul', ru: '', en: '' }, description: '', price: 3, tags: [], available: true });
  return { default: m };
});

describe('public site data', async () => {
  const { items, itemById } = await import('@/lib/menu');
  const { bestComboOffer } = await import('@/lib/upsell');

  it('hides "bitib" items', () => {
    expect(itemById.has('ciz-burger')).toBe(false);
    expect(items.some((i) => i.id === 'ciz-burger')).toBe(false);
  });
  it('falls back to the AZ name when RU/EN are empty', () => {
    expect(itemById.get('yeni')!.name).toEqual({ az: 'Yeni məhsul', ru: 'Yeni məhsul', en: 'Yeni məhsul' });
  });
  it('never offers a combo that contains an unavailable item', () => {
    // Burgerçi Menyu (ət) needs Çizburger, which is "bitib" now
    const offer = bestComboOffer([{ id: 'fri', qty: 1 }, { id: 'kola-05', qty: 1 }]);
    expect(offer?.combo.id).not.toBe('burgerci-et');
  });
});
