'use client';

import { useEffect, type ReactNode } from 'react';

/** Mobile bottom sheet; becomes a centered dialog on wider screens. */
export default function Sheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 animate-fade bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-sheet relative flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-card shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-white/20 sm:hidden" aria-hidden />
        {children}
      </div>
    </div>
  );
}
