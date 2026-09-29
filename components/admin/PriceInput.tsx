'use client';

import { useEffect, useRef, useState } from 'react';
import { isSuspiciousChange, parsePrice } from '@/lib/admin/price';
import { setSold, updateEntry } from '@/lib/admin/ops';
import { branchName } from '@/lib/admin/model';
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
 * Inline price cell for one item at one branch. Enter / ↓ saves and goes to the next row, ↑ to the previous one,
 * Tab moves across, Esc cancels. Empty "köhnə qiymət" removes the discount.
 *
 * `manageSold` (the comparison table): an empty price cell means "not sold here". Typing a price puts the item
 * on that branch's menu; clearing the price takes it off (after confirmation).
 */
export default function PriceInput({
  branch,
  itemId,
  col,
  list,
  className = '',
  manageSold = false,
}: {
  branch: string;
  itemId: string;
  col: Col;
  list: string;
  className?: string;
  manageSold?: boolean;
}) {
  const { data, update, toast, confirm } = useAdmin();
  const item = data.catalog.items.find((i) => i.id === itemId)!;
  const entry = data.menus[branch]?.items.find((e) => e.id === itemId);
  const bn = branchName(data, branch);
  const current = entry ? (col === 'price' ? entry.price : entry.oldPrice) : undefined;
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
    const fail = (msg: string) => {
      setBad(true);
      toast(msg, 'error');
      setValue(shown);
      setTimeout(() => setBad(false), 1500);
      return false;
    };

    // empty
    if (raw === '') {
      if (col === 'oldPrice' && entry) {
        settled.current = raw;
        update((d) => updateEntry(d, branch, itemId, { oldPrice: undefined }));
        return true;
      }
      if (col === 'price' && manageSold && entry) {
        pending.current = true;
        const ok = await confirm({ title: `${bn}: satışdan çıxarılsın?`, body: <p><b>{item.name.az}</b> {bn} filialının menyusundan çıxarılacaq. Digər filiallara təsir etmir.</p>, ok: 'Çıxar', danger: true });
        pending.current = false;
        if (!ok) return (setValue(shown), false);
        settled.current = raw;
        update((d) => setSold(d, branch, itemId, null));
        return true;
      }
      return fail('Qiymət yazın. Nümunə: 5.80');
    }

    const n = parsePrice(raw);
    if (n === null) return fail('Qiymət düzgün deyil. Nümunə: 5.80');

    // not sold here yet: a price puts it on this branch's menu
    if (!entry) {
      if (col !== 'price' || !manageSold) return fail('Əvvəlcə qiyməti yazın.');
      settled.current = raw;
      update((d) => setSold(d, branch, itemId, { price: n, available: true }));
      toast(`${item.name.az} ${bn} menyusuna əlavə olundu (hələ yayımlanmayıb)`);
      return true;
    }
    if (col === 'price' && entry.oldPrice !== undefined && n >= entry.oldPrice)
      return fail(`Yeni qiymət köhnə qiymətdən (${entry.oldPrice.toFixed(2)}) kiçik olmalıdır. Əvvəlcə köhnə qiyməti dəyişin və ya silin.`);
    if (col === 'oldPrice' && n <= entry.price) return fail(`Köhnə qiymət yeni qiymətdən (${entry.price.toFixed(2)}) böyük olmalıdır.`);
    if (col === 'price' && isSuspiciousChange(entry.price, n)) {
      pending.current = true;
      const ok = await confirm({
        title: 'Qiymət çox dəyişir',
        body: (
          <p>
            {bn}: <b>{item.name.az}</b> {entry.price.toFixed(2)} → <b>{n.toFixed(2)}</b> ₼. Əminsiniz?
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
    update((d) => updateEntry(d, branch, itemId, { [col]: n }));
    return true;
  };

  const notSold = !entry;
  return (
    <input
      type="text"
      inputMode="decimal"
      enterKeyHint="next"
      autoComplete="off"
      aria-label={`${item.name.az}: ${col === 'price' ? 'qiymət' : 'köhnə qiymət'} (${bn})`}
      aria-invalid={bad}
      data-col={col}
      data-list={list}
      value={value}
      placeholder={notSold ? '—' : col === 'oldPrice' ? '—' : ''}
      title={notSold ? `${bn} filialında satılmır. Qiymət yazsanız, menyuya əlavə olunacaq.` : undefined}
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
        bad ? 'border-red' : notSold ? 'border-dashed border-white/10 hover:border-white/30' : 'border-white/10 hover:border-white/30'
      } ${col === 'price' ? 'text-gold' : 'text-mute'} ${className}`}
    />
  );
}
