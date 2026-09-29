'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function Switch({ on, onChange, label, size = 'md' }: { on: boolean; onChange: (v: boolean) => void; label: string; size?: 'md' | 'lg' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      title={on ? 'Mövcuddur' : 'Bitib'}
      onClick={() => onChange(!on)}
      className={`relative inline-flex shrink-0 items-center rounded-full transition ${size === 'lg' ? 'h-8 w-14' : 'h-7 w-12'} ${on ? 'bg-ok' : 'bg-white/15'}`}
    >
      <span
        className={`inline-block rounded-full bg-white shadow transition ${size === 'lg' ? 'size-6' : 'size-5'} ${on ? (size === 'lg' ? 'translate-x-7' : 'translate-x-6') : 'translate-x-1'}`}
      />
    </button>
  );
}

export function Dialog({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('[data-autofocus], button, input, select, textarea')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (e.stopPropagation(), onClose());
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div ref={ref} className={`relative max-h-[90svh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-card p-5 shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <h2 className="text-lg font-bold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export const btn = {
  primary: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red px-4 font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40',
  gold: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-4 font-bold text-ink transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40',
  ghost: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 font-semibold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40',
  danger: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red/60 px-4 font-semibold text-[#ff7a70] transition hover:bg-red/10 disabled:opacity-40',
  icon: 'inline-grid size-11 place-items-center rounded-xl text-lg transition hover:bg-white/10 disabled:opacity-30',
};

/** Field styling without a width, for controls that sit side by side in a toolbar. */
export const inputBase =
  'rounded-xl border border-white/15 bg-ink px-3.5 py-2.5 text-base outline-none transition placeholder:text-mute/70 focus:border-gold aria-[invalid=true]:border-red';
export const input = `w-full ${inputBase}`;

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-cream/90">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-sm text-[#ff7a70]">{error}</p> : hint ? <p className="mt-1 text-xs text-mute">{hint}</p> : null}
    </div>
  );
}

export const isTyping = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
};
