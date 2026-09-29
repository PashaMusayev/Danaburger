'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ProductImage from './ProductImage';
import SectionTitle from './SectionTitle';
import { useBranch, useStore } from '@/lib/store';
import { fmt, savings, type MenuItem } from '@/lib/menu';

export default function Deals() {
  const { t } = useStore();
  const { deals } = useBranch().menu;
  const [expanded, setExpanded] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState({ first: 1, last: 1, atStart: true, atEnd: false });

  // which cards are on screen: drives the "1–4 / 30" counter, progress bar and arrow states
  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const cards = [...el.children] as HTMLElement[];
    const box = el.getBoundingClientRect();
    const vis = cards
      .map((c, i) => [c.getBoundingClientRect(), i] as const)
      // a card counts as shown once at least half of it is on screen
      .filter(([r]) => Math.min(r.right, box.right) - Math.max(r.left, box.left) >= r.width / 2)
      .map(([, i]) => i);
    const max = el.scrollWidth - el.clientWidth;
    setProgress({
      first: (vis[0] ?? 0) + 1,
      last: (vis[vis.length - 1] ?? 0) + 1,
      atStart: el.scrollLeft <= 4,
      atEnd: el.scrollLeft >= max - 4,
    });
  }, []);

  useEffect(() => {
    if (expanded) return;
    const el = trackRef.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    // mouse users: turn a vertical wheel over the carousel into horizontal movement,
    // but let the page scroll once the carousel reaches either end
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const max = el.scrollWidth - el.clientWidth;
      if ((e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max - 1)) return;
      e.preventDefault();
      el.scrollBy({ left: e.deltaY, behavior: 'auto' });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      el.removeEventListener('wheel', onWheel);
    };
  }, [expanded, measure]);

  const page = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  const toggle = () => {
    setExpanded((x) => !x);
    document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' });
  };

  // a branch may have no discounted sets at all
  if (!deals.length) return null;

  return (
    <section id="deals" className="py-16" aria-labelledby="deals-title">
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4">
        <SectionTitle kicker={t.deals.kicker} title={t.deals.title} id="deals-title" />
        <button
          onClick={toggle}
          className="mb-6 shrink-0 rounded-full border border-gold/50 px-4 py-2 text-sm font-bold text-gold transition hover:bg-gold/10"
          aria-expanded={expanded}
        >
          {expanded ? t.deals.less : `${t.deals.all} (${deals.length})`}
        </button>
      </div>

      {expanded ? (
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
          {deals.map((d) => (
            <DealCard key={d.id} d={d} />
          ))}
        </div>
      ) : (
        <>
          <div className="relative">
            <div
              ref={trackRef}
              className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 sm:scroll-px-[max(1rem,calc((100vw-72rem)/2+1rem))] sm:px-[max(1rem,calc((100vw-72rem)/2+1rem))]"
            >
              {deals.map((d) => (
                <DealCard key={d.id} d={d} className="w-[78%] shrink-0 snap-start sm:w-80" />
              ))}
            </div>
            <ArrowButton side="left" label={t.deals.prev} disabled={progress.atStart} onClick={() => page(-1)} />
            <ArrowButton side="right" label={t.deals.next} disabled={progress.atEnd} onClick={() => page(1)} />
          </div>

          <div className="mx-auto mt-2 flex max-w-6xl items-center gap-4 px-4">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
              <div
                className="h-full rounded-full bg-gold transition-[width] duration-150"
                style={{ width: `${(progress.last / deals.length) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-mute" aria-live="polite">
              {progress.first === progress.last ? progress.first : `${progress.first}–${progress.last}`} / {deals.length}
            </span>
          </div>
        </>
      )}
    </section>
  );
}

function ArrowButton({ side, label, disabled, onClick }: { side: 'left' | 'right'; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`absolute top-[38%] z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-ink/85 text-2xl font-bold shadow-xl backdrop-blur transition hover:bg-red disabled:pointer-events-none disabled:opacity-0 md:grid ${
        side === 'left' ? 'left-4' : 'right-4'
      }`}
    >
      {side === 'left' ? '‹' : '›'}
    </button>
  );
}

function DealCard({ d, className = '' }: { d: MenuItem; className?: string }) {
  const { t, locale, add, openItem } = useStore();
  const pct = Math.round((savings(d) / d.oldPrice!) * 100);
  return (
    <article className={`group relative overflow-hidden rounded-3xl border border-white/5 bg-card ${className}`}>
      <button onClick={() => openItem(d)} className="block w-full text-left">
        <ProductImage item={d} sizes="(max-width:640px) 80vw, 320px" className="aspect-[4/3]" />
        <span className="absolute left-3 top-3 rounded-full bg-red px-3 py-1 text-sm font-extrabold text-white shadow-lg">
          −{fmt(savings(d))} ₼ {t.deals.save}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-gold px-2.5 py-1 text-xs font-black text-ink">−{pct}%</span>
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
}
