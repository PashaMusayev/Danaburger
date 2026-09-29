'use client';

import { useEffect, useRef, useState } from 'react';
import { useBranch, useStore } from '@/lib/store';
import { fmt } from '@/lib/menu';
import { telHref, whatsappHref } from '@/lib/config';
import { track } from '@/lib/analytics';

export default function BottomBar() {
  const { t, count, total, setCartOpen, toast } = useStore();
  const { branch } = useBranch();
  const tel = telHref(branch.phone);
  const [bump, setBump] = useState(false);
  const prev = useRef(count);
  useEffect(() => {
    if (count > prev.current) {
      setBump(true);
      const id = setTimeout(() => setBump(false), 400);
      prev.current = count;
      return () => clearTimeout(id);
    }
    prev.current = count;
  }, [count]);

  return (
    <>
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-8" role="status">
          <span className="animate-rise rounded-full bg-cream px-4 py-2.5 text-sm font-bold text-ink shadow-2xl">✓ {toast}</span>
        </div>
      )}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:hidden"
        aria-label="Quick actions"
      >
        <div className="flex gap-2">
          {tel && (
            <a
              href={tel}
              onClick={() => track('call_click', { location: 'bottom_bar', branch: branch.id })}
              className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-card py-2 text-xs font-bold"
            >
              <span className="text-lg" aria-hidden>📞</span>
              {t.bar.call}
            </a>
          )}
          <a
            href={whatsappHref(branch.whatsapp, t.cart.msgHello(branch.name.az))}
            target="_blank"
            rel="noopener"
            onClick={() => track('whatsapp_click', { location: 'bottom_bar', branch: branch.id })}
            className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-card py-2 text-xs font-bold"
          >
            <span className="text-lg" aria-hidden>💬</span>
            {t.bar.whatsapp}
          </a>
          <button
            data-testid="cart-button"
            onClick={() => setCartOpen(true)}
            className={`flex flex-[1.6] items-center justify-center gap-2 rounded-2xl bg-red py-2 font-extrabold text-white ${bump ? 'bump' : ''}`}
          >
            <span className="relative text-xl" aria-hidden>
              🛒
              {count > 0 && (
                <span className="absolute -right-2.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-black text-ink">
                  {count}
                </span>
              )}
            </span>
            <span>{count > 0 ? `${fmt(total)} ₼` : t.bar.cart}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
