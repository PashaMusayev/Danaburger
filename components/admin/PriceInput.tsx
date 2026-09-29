'use client';

import { useEffect, useRef, useState } from 'react';
import type { RawMenuItem } from '@/lib/menu';
import { isSuspiciousChange, parsePrice } from '@/lib/admin/price';
import { updateItem } from '@/lib/admin/ops';
import { useAdmin } from './AdminStore';

type Col = 'price' | 'oldPrice';

/** Move focus to the same column in the next/previous row (spreadsheet-style editing). */
function focusSibling(from: HTMLInputElement, dir: 1 | -1) {
  const all = [...document.querySelectorAll<HTMLInputElement>(`input[data-col="${from.dataset.col}"][data-list="${from.dataset.list}"]`)];
  const next = all[all.indexOf(from) + dir];
  if (next) {
    next.focus();
    next.select();
  }
}

/**
 * Inline price cell. Enter / ↓ saves and goes to the next row, ↑ to the previous one, Tab moves across,
 * Esc cancels. Empty "köhnə qiymət" removes the discount.
 */
export default function PriceInput({ item, col, list, className = '' }: { item: RawMenuItem; col: Col; list: string; className?: string }) {
  const { setMenu, toast, confirm } = useAdmin();
  const current = col === 'price' ? item.price : item.oldPrice;
  const shown = current === undefined ? '' : current.toFixed(2);
  const [value, setValue] = useState(shown);
  const [bad, setBad] = useState(false);
  // Enter commits and moves focus, which fires blur → commit again with a stale value; a confirm dialog
  // stealing focus does the same. These refs make the second call a no-op.
  const pending = useRef(false);
  const settled = useRef<string | null>(null);
  useEffect(() => {
    setValue(shown);
    settled.current = null;
  }, [shown]);

  const commit = async (): Promise<boolean> => {
    const raw = value.trim();
    if (pending.current) return false;
    if (settled.current !== null && raw === settled.current) return true;
    if (raw === shown || (raw !== '' && parsePrice(raw) === current)) {
      setValue(shown);
      setBad(false);
      return true;
    }
    if (raw === '' && col === 'oldPrice') {
      settled.current = raw;
      setMenu((m) => updateItem(m, item.id, { oldPrice: undefined }));
      return true;
    }
    const n = parsePrice(raw);
    const fail = (msg: string) => {
      setBad(true);
      toast(msg, 'error');
      setValue(shown);
      setTimeout(() => setBad(false), 1500);
      return false;
    };
    if (n === null) return fail('Qiymət düzgün deyil. Nümunə: 5.80');
    if (col === 'price' && item.oldPrice !== undefined && n >= item.oldPrice)
      return fail(`Yeni qiymət köhnə qiymətdən (${item.oldPrice.toFixed(2)}) kiçik olmalıdır. Əvvəlcə köhnə qiyməti dəyişin və ya silin.`);
    if (col === 'oldPrice' && n <= item.price) return fail(`Köhnə qiymət yeni qiymətdən (${item.price.toFixed(2)}) böyük olmalıdır.`);
    if (col === 'price' && isSuspiciousChange(item.price, n)) {
      pending.current = true;
      const ok = await confirm({
        title: 'Qiymət çox dəyişir',
        body: (
          <p>
            <b>{item.name.az}</b>: {item.price.toFixed(2)} → <b>{n.toFixed(2)}</b> ₼. Əminsiniz?
          </p>
        ),
        ok: 'Bəli, dəyiş',
      });
      pending.current = false;
      if (!ok) {
        setValue(shown);
        return false;
      }
    }
    settled.current = raw;
    setMenu((m) => updateItem(m, item.id, { [col]: n }));
    return true;
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      enterKeyHint="next"
      autoComplete="off"
      aria-label={`${item.name.az}: ${col === 'price' ? 'qiymət' : 'köhnə qiymət'}`}
      aria-invalid={bad}
      data-col={col}
      data-list={list}
      value={value}
      placeholder={col === 'oldPrice' ? '—' : ''}
      onChange={(e) => setValue(e.target.value)}
      onFocus={(e) => e.currentTarget.select()}
      onClick={(e) => e.stopPropagation()}
      onBlur={() => void commit()}
      onKeyDown={async (e) => {
        const el = e.currentTarget;
        if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (await commit()) focusSibling(el, e.key === 'ArrowUp' ? -1 : 1);
        } else if (e.key === 'Escape') {
          e.stopPropagation();
          setValue(shown);
          el.blur();
        }
      }}
      className={`w-24 rounded-lg border bg-ink px-2.5 py-2 text-right font-bold tabular-nums outline-none transition focus:border-gold ${
        bad ? 'border-red' : 'border-white/10 hover:border-white/30'
      } ${col === 'price' ? 'text-gold' : 'text-mute'} ${className}`}
    />
  );
}
