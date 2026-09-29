'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sheet from './Sheet';
import { cartKey, read, useBranch, useStore, write } from '@/lib/store';
import { branches, getBranchMenu } from '@/lib/branches';
import type { BranchInfo } from '@/lib/menu';
import type { CartLine } from '@/lib/upsell';
import { track } from '@/lib/analytics';

/** "📍 Nərimanov ▾" in the header. With items in the cart it asks whether to move them first. */
export default function BranchSwitcher() {
  const { t, locale, cart, setCart, count } = useStore();
  const { branch, menu } = useBranch();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<BranchInfo | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const go = (b: BranchInfo) => {
    track('branch_switch', { from: branch.id, to: b.id });
    router.push(path.includes('/menu') ? `/${b.id}/menu/` : `/${b.id}/`);
  };

  const choose = (b: BranchInfo) => {
    setOpen(false);
    if (b.id === branch.id) return;
    if (count > 0) setTarget(b);
    else go(b);
  };

  // what can come along: same product on sale at the other branch (at that branch's price)
  const targetMenu = target ? getBranchMenu(target.id) : null;
  const movable = targetMenu ? cart.filter((l) => targetMenu.itemById.has(l.id)) : [];
  const missing = targetMenu ? cart.filter((l) => !targetMenu.itemById.has(l.id)) : [];

  const move = () => {
    if (!target) return;
    const merged = read<CartLine[]>(cartKey(target.id), []);
    for (const l of movable) {
      const e = merged.find((x) => x.id === l.id);
      if (e) e.qty += l.qty;
      else merged.push({ ...l });
    }
    write(cartKey(target.id), merged);
    setCart([]);
    go(target);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t.branches.switchLabel}: ${branch.name[locale]}`}
        className="flex max-w-[9.5rem] items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-sm font-bold text-gold transition hover:bg-gold/20 sm:max-w-none"
      >
        <span aria-hidden>📍</span>
        <span className="truncate">{branch.name[locale]}</span>
        <span aria-hidden className="text-xs">▾</span>
      </button>
      {open && (
        <ul role="listbox" aria-label={t.branches.switchLabel} className="absolute left-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl">
          {branches.map((b) => (
            <li key={b.id} role="option" aria-selected={b.id === branch.id}>
              <button onClick={() => choose(b)} className={`flex w-full items-center justify-between px-4 py-3 text-left font-semibold hover:bg-white/5 ${b.id === branch.id ? 'text-gold' : ''}`}>
                <span>📍 {b.name[locale]}</span>
                {b.id === branch.id && <span aria-hidden>✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!target} onClose={() => setTarget(null)} label={t.branches.moveTitle(count)}>
        {target && (
          <div className="p-5">
            <h2 className="text-xl font-bold">{t.branches.moveTitle(count)}</h2>
            <p className="mt-2 text-cream/85">{t.branches.moveText(target.name[locale])}</p>
            {missing.length > 0 && (
              <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/10 p-3 text-sm" data-testid="move-missing">
                <p className="font-semibold text-gold">{t.branches.moveMissing(target.name[locale])}</p>
                <ul className="mt-1.5 list-inside list-disc text-cream/85">
                  {missing.map((l) => (
                    <li key={l.id}>
                      {l.qty}× {menu.itemById.get(l.id)?.name[locale] ?? l.id}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-5 grid gap-2">
              <button onClick={move} disabled={!movable.length} className="rounded-xl bg-red px-4 py-3 font-extrabold text-white transition hover:bg-red-600 disabled:opacity-40">
                {t.branches.move}
              </button>
              <button onClick={() => go(target)} className="rounded-xl border border-white/15 px-4 py-3 font-bold transition hover:bg-white/5">
                {t.branches.keep}
              </button>
              <p className="text-center text-xs text-mute">{t.branches.keepHint}</p>
              <button onClick={() => setTarget(null)} className="py-2 text-sm text-mute hover:text-cream">
                {t.branches.cancel}
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
