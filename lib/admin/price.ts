/** "5,80" / "5.8" / " 12 " → number; null when it isn't a valid price (> 0, at most 2 decimals). */
export function parsePrice(input: string | number): number | null {
  const s = String(input).trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Math.round(Number(s) * 100) / 100;
  return n > 0 ? n : null;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** True when the change is big enough that it's probably a typo (5.80 → 58.00). */
export const isSuspiciousChange = (from: number, to: number) => Math.abs(to - from) / from > 0.5;

export type BulkOp = { mode: 'amount' | 'percent'; value: number; roundTo10?: boolean };

export function applyBulk(price: number, op: BulkOp): number {
  let n = op.mode === 'amount' ? price + op.value : price * (1 + op.value / 100);
  n = op.roundTo10 ? Math.round(n * 10) / 10 : round2(n);
  return round2(n);
}
