import type { BranchMenu, MenuItem } from './menu';

export type CartLine = { id: string; qty: number };

const FOOD = new Set(['burgers', 'signature', 'shawarma', 'grill', 'pizza', 'pide', 'lahmacun', 'fastfood']);
const DRINK = new Set(['drinks', 'coffee', 'fresh']);
const MEALS = new Set(['sets', 'combos', 'breakfast']);

// Every function takes the branch's menu: prices, what's on sale and which combos can be completed differ per branch.

export const lineTotal = (m: BranchMenu, l: CartLine) => (m.itemById.get(l.id)?.price ?? 0) * l.qty;
export const cartTotal = (m: BranchMenu, cart: CartLine[]) => cart.reduce((s, l) => s + lineTotal(m, l), 0);

const catOf = (m: BranchMenu, l: CartLine) => m.itemById.get(l.id)?.category ?? '';

export function suggestDrinks(m: BranchMenu, cart: CartLine[]): MenuItem[] {
  const hasFood = cart.some((l) => FOOD.has(catOf(m, l)));
  const hasDrink = cart.some((l) => DRINK.has(catOf(m, l)) || MEALS.has(catOf(m, l)));
  if (!hasFood || hasDrink) return [];
  return ['kola-05', 'ayran', 'kola-03'].map((id) => m.itemById.get(id)!).filter(Boolean);
}

/** Empty at a branch that sells no sauces. */
export function suggestSauces(m: BranchMenu, cart: CartLine[]): MenuItem[] {
  const hasFood = cart.some((l) => FOOD.has(catOf(m, l)));
  const hasSauce = cart.some((l) => catOf(m, l) === 'sauces');
  if (!hasFood || hasSauce) return [];
  const preferred = ['sous-pendirli', 'sous-sarimsaqli', 'sous-barbekyu'].map((id) => m.itemById.get(id)).filter(Boolean) as MenuItem[];
  return preferred.length ? preferred : m.sauces.slice(0, 3);
}

type Match = {
  combo: MenuItem;
  used: CartLine[]; // units taken from the cart
  usedCost: number;
  missing: { item: MenuItem; qty: number }[];
};

/** Greedily fills each combo slot from what's already in the cart. */
function match(m: BranchMenu, combo: MenuItem, cart: CartLine[]): Match {
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
    if (need) missing.push({ item: m.itemById.get(slot.anyOf[0])!, qty: need });
  }
  const usedLines = [...used].map(([id, qty]) => ({ id, qty }));
  return { combo, used: usedLines, usedCost: cartTotal(m, usedLines), missing };
}

export type ComboOffer =
  | { kind: 'swap'; combo: MenuItem; used: CartLine[]; save: number; bonus: MenuItem[] }
  | { kind: 'near'; combo: MenuItem; used: CartLine[]; missing: Match['missing']; extra: number };

/**
 * "swap": the cart already contains everything in a combo, so swapping saves money.
 * "near": one unit is missing; completing the combo costs less than buying that item alone.
 */
export function bestComboOffer(menu: BranchMenu, cart: CartLine[]): ComboOffer | null {
  let swap: ComboOffer | null = null;
  let near: ComboOffer | null = null;
  let swapBest = 0.009;
  let nearBest = 0.009;
  for (const combo of menu.combos) {
    const m = match(menu, combo, cart);
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
