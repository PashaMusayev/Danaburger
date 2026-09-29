'use client';

import { useEffect, useState } from 'react';
import Sheet from './Sheet';
import ProductImage from './ProductImage';
import { useStore } from '@/lib/store';
import { fmt, items, savings } from '@/lib/menu';

const SAUCE_CATS = new Set(['burgers', 'signature', 'shawarma', 'grill', 'fastfood', 'lahmacun', 'pide', 'pizza']);
const sauces = items.filter((i) => i.category === 'sauces').slice(0, 8);

export default function ProductSheet() {
  const { sheetItem: item, openItem, t, locale, add } = useStore();
  const [qty, setQty] = useState(1);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    setQty(1);
    setPicked(new Set());
  }, [item]);

  if (!item) return null;
  const close = () => openItem(null);
  const offerSauce = SAUCE_CATS.has(item.category);
  const extra = [...picked].reduce((s, id) => s + (items.find((i) => i.id === id)?.price ?? 0), 0);
  // one sauce per portion
  const total = (item.price + extra) * qty;
  const isSet = item.category === 'sets' || item.category === 'combos' || item.category === 'breakfast';

  return (
    <Sheet open onClose={close} label={item.name[locale]}>
      <div className="overflow-y-auto">
        <div className="relative">
          <ProductImage item={item} sizes="(max-width:640px) 100vw, 512px" className="aspect-[16/10] w-full" priority />
          <button
            onClick={close}
            aria-label={t.sheet.close}
            className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-black/60 text-xl backdrop-blur"
          >
            ✕
          </button>
          {savings(item) > 0 && (
            <span className="absolute bottom-3 left-3 rounded-full bg-red px-3 py-1 text-sm font-extrabold text-white">
              −{fmt(savings(item))} ₼ {t.deals.save}
            </span>
          )}
        </div>

        <div className="p-5">
          {item.group && <p className="font-script text-xl text-gold">{item.group[locale]}</p>}
          <h2 className={`${isSet ? 'font-script normal-case' : 'font-display uppercase'} text-3xl leading-tight`}>
            {item.name[locale]}
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-white/5 px-2 py-0.5 text-xs font-semibold text-mute">
                {t.tags[tag]}
              </span>
            ))}
          </div>

          {item.description && (
            <>
              <h3 className="mt-5 text-xs font-bold uppercase tracking-widest text-mute">
                {isSet ? t.sheet.includes : t.sheet.ingredients}
              </h3>
              <p className="mt-1.5 leading-relaxed text-cream/90">{item.description}</p>
            </>
          )}

          {offerSauce && (
            <>
              <h3 className="mt-6 text-xs font-bold uppercase tracking-widest text-gold">{t.sheet.addSauce}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {sauces.map((s) => {
                  const on = picked.has(s.id);
                  return (
                    <button
                      key={s.id}
                      aria-pressed={on}
                      onClick={() =>
                        setPicked((p) => {
                          const n = new Set(p);
                          if (on) n.delete(s.id);
                          else n.add(s.id);
                          return n;
                        })
                      }
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                        on ? 'border-gold bg-gold/15 text-gold' : 'border-white/10 text-cream/80'
                      }`}
                    >
                      {on ? '✓ ' : '+ '}
                      {s.name[locale]} <span className="text-mute">{fmt(s.price)} ₼</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-white/10 bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center rounded-xl border border-white/10">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="size-11 text-xl" aria-label="−">
            −
          </button>
          <span className="w-6 text-center font-bold" aria-live="polite">
            {qty}
          </span>
          <button onClick={() => setQty((q) => q + 1)} className="size-11 text-xl" aria-label="+">
            +
          </button>
        </div>
        <button
          onClick={() => {
            add(item.id, qty);
            picked.forEach((id) => add(id, qty));
            close();
          }}
          className="flex flex-1 items-center justify-between rounded-xl bg-red px-5 py-3.5 font-extrabold text-white transition hover:bg-red-600 active:scale-[.98]"
        >
          <span>{t.sheet.addToCart}</span>
          <span>{fmt(total)} ₼</span>
        </button>
      </div>
    </Sheet>
  );
}
