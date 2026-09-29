'use client';

import ProductImage from './ProductImage';
import SectionTitle from './SectionTitle';
import { useBranch, useStore } from '@/lib/store';
import { fmt } from '@/lib/menu';

// Breakfast sits deep in the menu (and has no discount, so it's not in Deals); surface it on the home page.
export default function Breakfast() {
  const { t, locale, add, openItem } = useStore();
  const breakfasts = useBranch().menu.items.filter((i) => i.category === 'breakfast');
  if (!breakfasts.length) return null;
  return (
    <section id="breakfast" className="py-12" aria-labelledby="breakfast-title">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle kicker={t.breakfast.kicker} title={t.breakfast.title} id="breakfast-title" />
        <div className={`grid gap-4 ${breakfasts.length > 1 ? 'md:grid-cols-2' : 'md:max-w-xl'}`}>
          {breakfasts.map((b) => (
            <article key={b.id} className="group overflow-hidden rounded-3xl border border-gold/20 bg-card">
              <button onClick={() => openItem(b)} className="relative block w-full text-left" aria-label={`${t.breakfast.more}: ${b.name[locale]}`}>
                <ProductImage item={b} sizes="(max-width:768px) 100vw, 560px" className="aspect-[16/9]" />
                <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-sm font-black text-ink">
                  ☀️ {b.id === 'seher-2' ? t.breakfast.for2 : b.id === 'seher-1' ? t.breakfast.for1 : t.breakfast.title}
                </span>
              </button>
              <div className="p-4">
                <h3 className="font-script text-2xl">{b.name[locale]}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-mute">{b.description}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="whitespace-nowrap font-display text-3xl text-gold">{fmt(b.price)} ₼</span>
                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                    <button
                      onClick={() => openItem(b)}
                      className="rounded-xl border border-white/15 px-3.5 py-2.5 text-sm font-bold transition hover:bg-white/5"
                    >
                      {t.breakfast.more}
                    </button>
                    <button
                      onClick={() => add(b.id)}
                      className="rounded-xl bg-cream px-4 py-2.5 text-sm font-extrabold text-ink transition hover:bg-white active:scale-95"
                    >
                      + {t.breakfast.add}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
