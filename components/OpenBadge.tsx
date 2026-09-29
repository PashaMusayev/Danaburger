'use client';

import { useEffect, useState } from 'react';
import { getOpenStatus, type Hours, type OpenStatus } from '@/lib/hours';
import { useStore } from '@/lib/store';

/** Uses the given hours, or the current branch's. */
export default function OpenBadge({ className = '', hours: given }: { className?: string; hours?: Hours }) {
  const { t, branch } = useStore();
  const hours = (given ?? branch?.hours)!;
  // Rendered only on the client: the static HTML can't know the visitor's current time.
  const [s, setS] = useState<OpenStatus | null>(null);
  useEffect(() => {
    const tick = () => setS(getOpenStatus(hours));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [hours]);

  if (!s) return <span className={`inline-block h-8 w-44 rounded-full bg-white/5 ${className}`} aria-hidden />;

  const soon = s.open && s.minutesToChange <= 45;
  const color = s.open ? (soon ? 'text-gold' : 'text-ok') : 'text-red';
  const label = s.open
    ? `${t.status.open} · ${soon ? t.status.closingSoon(s.minutesToChange) : t.status.until(hours.close)}`
    : `${t.status.closed} · ${t.status.opensAt(hours.open)}`;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-sm font-semibold backdrop-blur ${className}`}
      role="status"
    >
      <span className={`size-2 rounded-full bg-current pulse-dot ${color}`} />
      <span>{label}</span>
    </span>
  );
}
