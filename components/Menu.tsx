'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ProductImage from './ProductImage';
import SectionTitle from './SectionTitle';
import { useBranch, useStore } from '@/lib/store';
import { fmt, type BranchMenu, type MenuItem, type Tag } from '@/lib/menu';

type Filter = 'chicken' | 'meat' | 'spicy' | 'veg' | 'under10';
const FILTERS: Filter[] = ['chicken', 'meat', 'spicy', 'veg', 'under10'];

// "cizburger" should find "Çizburger", "seher" should find "Səhər"
const norm = (s: string) =>
  s
    .toLocaleLowerCase('az')
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const searchIndex = ({ items, categories }: BranchMenu) =>
  new Map(
    items.map((i) => [
      i.id,
      norm([i.name.az, i.name.ru, i.name.en, i.group?.az ?? '', i.description, categories.find((c) => c.id === i.category)?.name.az ?? ''].join(' ')),
    ]),
  );

export default function Menu({ standalone = false }: { standalone?: boolean }) {
  const { t, locale } = useStore();
  const { menu } = useBranch();
  const { items, categories } = menu;
  const haystack = useMemo(() => searchIndex(menu), [menu]);
  // Categories with no photos render as a classic printed-menu list instead of photo cards.
  const photoCats = useMemo(() => new Set(items.filter((i) => i.image).map((i) => i.category)), [items]);
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Set<Filter>>(new Set());
  const [active, setActive] = useState(categories[0].id);
  const tabsRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => {
    const nq = norm(q.trim());
    return items.filter((i) => {
      if (nq && !haystack.get(i.id)!.includes(nq)) return false;
      for (const f of filters) {
        if (f === 'under10' ? i.price >= 10 : !i.tags.includes(f as Tag)) return false;
      }
      return true;
    });
  }, [q, filters, items, haystack]);

  const byCat = useMemo(
    () =>
      categories
        .map((c) => ({ cat: c, list: visible.filter((i) => i.category === c.id) }))
        .filter((x) => x.list.length),
    [visible, categories],
  );

  // highlight the tab of the section currently on screen
  useEffect(() => {
    const els = byCat.map(({ cat }) => document.getElementById(`cat-${cat.id}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id.slice(4));
      },
      { rootMargin: '-130px 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [byCat]);

  useEffect(() => {
    // scroll only the tab strip; scrollIntoView would also scroll the page on load
    const bar = tabsRef.current;
    const tab = bar?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    if (bar && tab) bar.scrollTo({ left: tab.offsetLeft - bar.clientWidth / 2 + tab.clientWidth / 2, behavior: 'smooth' });
  }, [active]);

  const toggle = (f: Filter) =>
    setFilters((prev) => {
      const n = new Set(prev);
      if (n.has(f)) n.delete(f);
      else n.add(f);
      return n;
    });

  return (
    <section id="menu" className={standalone ? 'pb-32 pt-6' : 'pb-16 pt-8'} aria-labelledby="menu-title">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle kicker={t.menu.kicker} title={t.menu.title} id="menu-title" />
      </div>

      {/* sticky controls */}
      <div className="sticky top-16 z-30 border-y border-white/5 bg-ink/90 backdrop-blur-md">
        <div ref={tabsRef} className="no-scrollbar mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3">
          {byCat.map(({ cat }) => (
            <a
              key={cat.id}
              data-cat={cat.id}
              href={`#cat-${cat.id}`}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                active === cat.id ? 'bg-red text-white' : 'bg-card text-mute hover:text-cream'
              }`}
            >
              <span className="mr-1" aria-hidden>
                {cat.icon}
              </span>
              {cat.name[locale]}
            </a>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">{t.menu.search}</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute" aria-hidden>
              🔍
            </span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.menu.search}
              className="w-full rounded-2xl border border-white/10 bg-card py-3.5 pl-11 pr-4 text-base outline-none placeholder:text-mute focus:border-gold"
            />
          </label>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => toggle(f)}
                aria-pressed={filters.has(f)}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold transition ${
                  filters.has(f) ? 'border-gold bg-gold text-ink' : 'border-white/10 text-cream/80 hover:border-white/30'
                }`}
              >
                {t.menu.filters[f]}
              </button>
            ))}
          </div>
        </div>

        {byCat.length === 0 && <p className="py-16 text-center text-mute">{t.menu.empty}</p>}

        {byCat.map(({ cat, list }) => (
          <div key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-32 pt-10">
            <h3 className="flex items-center gap-3 font-display text-3xl uppercase">
              <span aria-hidden>{cat.icon}</span>
              {cat.name[locale]}
              <span className="rule flex-1" />
            </h3>
            {groupBy(list).map(([group, rows]) => (
              <div key={group?.az ?? '_'}>
                {group && <p className="mt-6 font-script text-2xl text-gold">{group[locale]}</p>}
                {photoCats.has(cat.id) ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {rows.map((i) => (
                      <Card key={i.id} item={i} />
                    ))}
                  </div>
                ) : (
                  <ul className="mt-3 grid gap-x-10 sm:grid-cols-2">
                    {rows.map((i) => (
                      <Row key={i.id} item={i} />
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function groupBy(list: MenuItem[]) {
  const out: [MenuItem['group'] | null, MenuItem[]][] = [];
  for (const i of list) {
    const key = i.group ?? null;
    const last = out[out.length - 1];
    if (last && last[0]?.az === key?.az) last[1].push(i);
    else out.push([key, [i]]);
  }
  return out;
}

function Price({ item }: { item: MenuItem }) {
  return (
    <span className="flex items-baseline gap-2 whitespace-nowrap">
      {item.oldPrice && <s className="text-xs text-mute decoration-red decoration-2">{fmt(item.oldPrice)}</s>}
      <span className="font-display text-xl text-gold">{fmt(item.price)} ₼</span>
    </span>
  );
}

function AddButton({ item }: { item: MenuItem }) {
  const { add, t } = useStore();
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        add(item.id);
      }}
      aria-label={`${t.menu.add}: ${item.name.az}`}
      className="grid size-10 shrink-0 place-items-center rounded-xl bg-red text-2xl font-bold leading-none text-white transition hover:bg-red-600 active:scale-90"
    >
      +
    </button>
  );
}

function Card({ item }: { item: MenuItem }) {
  const { locale, t, openItem } = useStore();
  const tag = item.tags.find((x) => x === 'popular' || x === 'new' || x === 'spicy');
  return (
    <article
      onClick={() => openItem(item)}
      className="group flex cursor-pointer gap-3 rounded-2xl border border-white/5 bg-card p-2.5 transition hover:border-white/15"
    >
      <ProductImage item={item} sizes="112px" className="size-28 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <div className="flex items-start gap-2">
          <h4 className="font-bold leading-snug">{item.name[locale]}</h4>
          {tag && (
            <span
              className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase ${
                tag === 'spicy' ? 'bg-red/20 text-[#ff7a70]' : 'bg-gold/15 text-gold'
              }`}
            >
              {t.tags[tag]}
            </span>
          )}
        </div>
        {item.description && <p className="mt-1 line-clamp-2 text-xs text-mute">{item.description}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Price item={item} />
          <AddButton item={item} />
        </div>
      </div>
    </article>
  );
}

function Row({ item }: { item: MenuItem }) {
  const { locale, openItem } = useStore();
  return (
    <li onClick={() => openItem(item)} className="cursor-pointer border-b border-white/5 py-3 transition hover:bg-white/[.02]">
      <div className="flex items-center gap-3">
        <span className="min-w-0 font-semibold">{item.name[locale]}</span>
        <span className="h-px flex-1 bg-red/60" aria-hidden />
        <Price item={item} />
        <AddButton item={item} />
      </div>
      {item.description && <p className="mt-0.5 pr-14 text-xs text-mute">{item.description}</p>}
    </li>
  );
}
