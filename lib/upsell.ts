import { items, itemById, type MenuItem } from './menu';

export type CartLine = { id: string; qty: number };

const FOOD = new Set(['burgers', 'signature', 'shawarma', 'grill', 'pizza', 'pide', 'lahmacun', 'fastfood']);
const DRINK = new Set(['drinks', 'coffee', 'fresh']);
const MEALS = new Set(['sets', 'combos', 'breakfast']);

const combos = items.filter((i) => i.includes?.length);

export const lineTotal = (l: CartLine) => (itemById.get(l.id)?.price ?? 0) * l.qty;
export const cartTotal = (cart: CartLine[]) => cart.reduce((s, l) => s + lineTotal(l), 0);

const catOf = (l: CartLine) => itemById.get(l.id)?.category ?? '';

export function suggestDrinks(cart: CartLine[]): MenuItem[] {
  const hasFood = cart.some((l) => FOOD.has(catOf(l)));
  const hasDrink = cart.some((l) => DRINK.has(catOf(l)) || MEALS.has(catOf(l)));
  if (!hasFood || hasDrink) return [];
  return ['kola-05', 'ayran', 'kola-03'].map((id) => itemById.get(id)!).filter(Boolean);
}

export function suggestSauces(cart: CartLine[]): MenuItem[] {
  const hasFood = cart.some((l) => FOOD.has(catOf(l)));
  const hasSauce = cart.some((l) => catOf(l) === 'sauces');
  if (!hasFood || hasSauce) return [];
  return ['sous-pendirli', 'sous-sarimsaqli', 'sous-barbekyu'].map((id) => itemById.get(id)!).filter(Boolean);
}

type Match = {
  combo: MenuItem;
  used: CartLine[]; // units taken from the cart
  usedCost: number;
  missing: { item: MenuItem; qty: number }[];
};

/** Greedily fills each combo slot from what's already in the cart. */
function match(combo: MenuItem, cart: CartLine[]): Match {
  const left = new Map(cart.map((l) => [l.id, l.qty]));
  const used = new Map<string, number>();
  const missing: Match['missing'] = [];
  for (const slot of combo.includes!) {
    let need = slot.qty;
    for (const id of slot.anyOf) {
      const have = left.get(id) ?? 0;
      const take = Math.min(have, need);
      if (take > 0) {
        left.set(id, have - take);
        used.set(id, (used.get(id) ?? 0) + take);
        need -= take;
      }
      if (!need) break;
    }
    if (need) missing.push({ item: itemById.get(slot.anyOf[0])!, qty: need });
  }
  const usedLines = [...used].map(([id, qty]) => ({ id, qty }));
  return { combo, used: usedLines, usedCost: cartTotal(usedLines), missing };
}

export type ComboOffer =
  | { kind: 'swap'; combo: MenuItem; used: CartLine[]; save: number; bonus: MenuItem[] }
  | { kind: 'near'; combo: MenuItem; used: CartLine[]; missing: Match['missing']; extra: number };

/**
 * "swap": the cart already contains everything in a combo, so swapping saves money.
 * "near": one unit is missing; completing the combo costs less than buying that item alone.
 */
export function bestComboOffer(cart: CartLine[]): ComboOffer | null {
  let swap: ComboOffer | null = null;
  let near: ComboOffer | null = null;
  let swapBest = 0.009;
  let nearBest = 0.009;
  for (const combo of combos) {
    const m = match(combo, cart);
    const missingUnits = m.missing.reduce((s, x) => s + x.qty, 0);
    if (missingUnits === 0) {
      const save = m.usedCost - combo.price;
      if (save > swapBest) {
        swap = { kind: 'swap', combo, used: m.used, save, bonus: [] };
        swapBest = save;
      }
    } else if (missingUnits === 1 && m.used.length > 0) {
      const extra = combo.price - m.usedCost;
      if (extra <= 0) {
        // the combo is cheaper than what's in the cart AND adds the missing item
        if (-extra > swapBest) {
          swap = { kind: 'swap', combo, used: m.used, save: -extra, bonus: m.missing.map((x) => x.item) };
          swapBest = -extra;
        }
        continue;
      }
      // only suggest when completing the combo beats buying the missing item on its own
      const gain = m.missing[0].item.price - extra;
      if (gain > nearBest) {
        near = { kind: 'near', combo, used: m.used, missing: m.missing, extra };
        nearBest = gain;
      }
    }
  }
  return swap ?? near;
}

/** Removes the used units from the cart and adds the combo. */
export function applyCombo(cart: CartLine[], used: CartLine[], comboId: string): CartLine[] {
  const next = cart.map((l) => ({ ...l }));
  for (const u of used) {
    const l = next.find((x) => x.id === u.id);
    if (l) l.qty -= u.qty;
  }
  const existing = next.find((l) => l.id === comboId);
  if (existing) existing.qty += 1;
  else next.push({ id: comboId, qty: 1 });
  return next.filter((l) => l.qty > 0);
}
