'use client';

import ProductImage from './ProductImage';
import SectionTitle from './SectionTitle';
import { useStore } from '@/lib/store';
import { deals, fmt, savings } from '@/lib/menu';

export default function Deals() {
  const { t, locale, add, openItem } = useStore();
  return (
    <section id="deals" className="py-16" aria-labelledby="deals-title">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle kicker={t.deals.kicker} title={t.deals.title} id="deals-title" />
      </div>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-[max(1rem,calc((100vw-72rem)/2+1rem))]">
        {deals.map((d) => {
          const pct = Math.round((savings(d) / d.oldPrice!) * 100);
          return (
            <article
              key={d.id}
              className="group relative w-[78%] shrink-0 snap-start overflow-hidden rounded-3xl border border-white/5 bg-card sm:w-80"
            >
              <button onClick={() => openItem(d)} className="block w-full text-left">
                <ProductImage item={d} sizes="(max-width:640px) 80vw, 320px" className="aspect-[4/3]" />
                <span className="absolute left-3 top-3 rounded-full bg-red px-3 py-1 text-sm font-extrabold text-white shadow-lg">
                  −{fmt(savings(d))} ₼ {t.deals.save}
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-gold px-2.5 py-1 text-xs font-black text-ink">
                  −{pct}%
                </span>
                <div className="p-4 pb-0">
                  <h3 className="font-script text-2xl leading-tight">{d.name[locale]}</h3>
                  <p className="mt-1 line-clamp-2 min-h-10 text-sm text-mute">{d.description}</p>
                </div>
              </button>
              <div className="flex items-end justify-between p-4">
                <div className="leading-none">
                  <s className="text-sm text-mute decoration-red decoration-2">{fmt(d.oldPrice!)} ₼</s>
                  <div className="font-display text-3xl text-gold">{fmt(d.price)} ₼</div>
                </div>
                <button
                  onClick={() => add(d.id)}
                  className="rounded-xl bg-cream px-4 py-2.5 text-sm font-extrabold text-ink transition hover:bg-white active:scale-95"
                >
                  + {t.deals.add}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
