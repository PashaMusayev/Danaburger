'use client';

import { useEffect, useMemo, useState } from 'react';
import Sheet from './Sheet';
import { useBranch, useStore } from '@/lib/store';
import { fmt, type BranchMenu, type MenuItem } from '@/lib/menu';
import { applyCombo, bestComboOffer, lineTotal, suggestDrinks, suggestSauces, type CartLine } from '@/lib/upsell';
import { whatsappHref } from '@/lib/config';
import { track } from '@/lib/analytics';

const CUSTOMER_KEY = 'db.customer';

// The kitchen reads Azerbaijani, so the order text always uses AZ names.
// Grouped items need their group to be unambiguous: "Çörəkdə (Ət şaurma)", "Limonad: Manqo".
const azName = (i: MenuItem) =>
  !i.group ? i.name.az : i.category === 'shawarma' ? `${i.name.az} (${i.group.az} şaurma)` : `${i.group.az}: ${i.name.az}`;

export function buildMessage(menu: BranchMenu, branchName: string, cart: CartLine[], total: number, name: string, address: string, note: string) {
  const lines = cart.map((l) => {
    const i = menu.itemById.get(l.id)!;
    return `• ${l.qty}× ${azName(i)} — ${fmt(lineTotal(menu, l))} ₼`;
  });
  const extra = [name && `Ad: ${name}`, address && `Ünvan: ${address}`, note && `Qeyd: ${note}`].filter(Boolean);
  // first line names the branch so an order sent to the wrong number is still obvious
  return [`Salam! ${branchName} filialına sifariş:`, '', ...lines, '', `Cəmi: ${fmt(total)} ₼`, ...extra].join('\n');
}

export default function CartSheet() {
  const { cartOpen, setCartOpen, cart, setCart, setQty, add, total, t, locale } = useStore();
  const { branch, menu } = useBranch();
  const [customer, setCustomer] = useState({ name: '', address: '', note: '' });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? 'null');
      if (saved) setCustomer((c) => ({ ...c, name: saved.name ?? '', address: saved.address ?? '' }));
    } catch {
      /* ignore */
    }
  }, []);

  const offer = useMemo(() => bestComboOffer(menu, cart), [menu, cart]);
  const drinks = useMemo(() => suggestDrinks(menu, cart), [menu, cart]);
  const sauces = useMemo(() => suggestSauces(menu, cart), [menu, cart]);

  const send = () => {
    const msg = buildMessage(menu, branch.name.az, cart, total, customer.name.trim(), customer.address.trim(), customer.note.trim());
    try {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name: customer.name, address: customer.address }));
    } catch {
      /* ignore */
    }
    track('whatsapp_order', { value: Number(total.toFixed(2)), items: cart.reduce((s, l) => s + l.qty, 0), branch: branch.id });
    window.open(whatsappHref(branch.whatsapp, msg), '_blank', 'noopener');
  };

  return (
    <Sheet open={cartOpen} onClose={() => setCartOpen(false)} label={t.cart.title}>
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <h2 className="font-display text-3xl uppercase">{t.cart.title}</h2>
        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-sm text-mute underline-offset-2 hover:underline">
              {t.cart.clear}
            </button>
          )}
          <button
            onClick={() => setCartOpen(false)}
            aria-label={t.sheet.close}
            className="grid size-10 place-items-center rounded-full bg-white/5 text-xl"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="overflow-y-auto px-5 pb-4">
        {cart.length === 0 ? (
          <p className="py-14 text-center text-mute">{t.cart.empty}</p>
        ) : (
          <>
            <ul className="divide-y divide-white/5">
              {cart.map((l) => {
                const i = menu.itemById.get(l.id)!;
                return (
                  <li key={l.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">
                        {i.name[locale]}
                        {i.group && <span className="text-mute"> · {i.group[locale]}</span>}
                      </p>
                      <p className="text-sm text-mute">{fmt(i.price)} ₼</p>
                    </div>
                    <div className="flex items-center rounded-xl border border-white/10">
                      <button onClick={() => setQty(l.id, l.qty - 1)} className="size-9 text-lg" aria-label={l.qty === 1 ? t.cart.remove : '−'}>
                        {l.qty === 1 ? '🗑' : '−'}
                      </button>
                      <span className="w-6 text-center font-bold">{l.qty}</span>
                      <button onClick={() => setQty(l.id, l.qty + 1)} className="size-9 text-lg" aria-label="+">
                        +
                      </button>
                    </div>
                    <span className="w-16 text-right font-bold text-gold">{fmt(lineTotal(menu, l))}</span>
                  </li>
                );
              })}
            </ul>

            {offer && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-3.5">
                <span className="text-2xl" aria-hidden>
                  💡
                </span>
                <div className="min-w-0 flex-1 text-sm">
                  {offer.kind === 'swap' ? (
                    <>
                      <p className="font-bold">{t.cart.swapTitle(offer.combo.name[locale])}</p>
                      <p className="text-gold">
                        {t.cart.swapSave(fmt(offer.save))}
                        {offer.bonus.length > 0 && ` · ${t.cart.swapBonus(offer.bonus.map((b) => b.name[locale]).join(', '))}`}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold">{t.cart.nearTitle(offer.combo.name[locale])}</p>
                      <p className="text-gold">
                        {t.cart.nearText(offer.missing.map((m) => m.item.name[locale]).join(', '), fmt(offer.extra))}
                      </p>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    track('combo_upsell', { combo: offer.combo.id, kind: offer.kind });
                    setCart(applyCombo(cart, offer.used, offer.combo.id));
                  }}
                  className="shrink-0 rounded-xl bg-gold px-3.5 py-2 text-sm font-extrabold text-ink active:scale-95"
                >
                  {offer.kind === 'swap' ? t.cart.swapBtn : t.cart.nearBtn}
                </button>
              </div>
            )}

            {[
              { title: t.cart.upsellDrink, list: drinks },
              { title: t.cart.upsellSauce, list: sauces },
            ]
              .filter((x) => x.list.length)
              .map((x) => (
                <div key={x.title} className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-mute">{x.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {x.list.map((i) => (
                      <button
                        key={i.id}
                        onClick={() => add(i.id)}
                        className="rounded-full border border-white/10 px-3 py-1.5 text-sm font-semibold transition hover:border-gold"
                      >
                        + {i.name[locale]} <span className="text-gold">{fmt(i.price)} ₼</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

            <div className="mt-5 grid gap-2.5">
              <input
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                placeholder={t.cart.name}
                autoComplete="name"
                className="rounded-xl border border-white/10 bg-ink px-4 py-3 outline-none placeholder:text-mute focus:border-gold"
              />
              <input
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                placeholder={t.cart.address}
                autoComplete="street-address"
                className="rounded-xl border border-white/10 bg-ink px-4 py-3 outline-none placeholder:text-mute focus:border-gold"
              />
              <input
                value={customer.note}
                onChange={(e) => setCustomer({ ...customer, note: e.target.value })}
                placeholder={t.cart.note}
                className="rounded-xl border border-white/10 bg-ink px-4 py-3 outline-none placeholder:text-mute focus:border-gold"
              />
            </div>
          </>
        )}
      </div>

      {cart.length > 0 && (
        <div className="border-t border-white/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            onClick={send}
            className="flex w-full items-center justify-between rounded-xl bg-[#25D366] px-5 py-4 text-lg font-extrabold text-ink transition hover:brightness-105 active:scale-[.98]"
          >
            <span>💬 {t.cart.send}</span>
            <span>{fmt(total)} ₼</span>
          </button>
        </div>
      )}
    </Sheet>
  );
}
