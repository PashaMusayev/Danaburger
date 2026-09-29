'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RawMenuItem } from '@/lib/menu';
import { applyBulkPrices, deleteItems, moveItem, placeItem, previewBulk, updateItem, usedInCombos } from '@/lib/admin/ops';
import { searchNorm } from '@/lib/admin/slug';
import type { BulkOp } from '@/lib/admin/price';
import { useAdmin } from './AdminStore';
import ItemEditor, { TAG_LABEL } from './ItemEditor';
import PriceInput from './PriceInput';
import { Dialog, Switch, btn, input, inputBase, isTyping } from './ui';

type SortKey = 'default' | 'name' | 'category' | 'price' | 'available';

export default function MenuScreen() {
  const { menu, base, setMenu, confirm, toast, srcFor } = useAdmin();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'default', dir: 1 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const catName = useMemo(() => new Map(menu.categories.map((c) => [c.id, c])), [menu.categories]);
  const baseById = useMemo(() => new Map(base?.menu.items.map((i) => [i.id, i]) ?? []), [base]);

  const rows = useMemo(() => {
    const nq = searchNorm(q.trim());
    let list = menu.items.filter(
      (i) =>
        (cat === 'all' || i.category === cat) &&
        (!nq || searchNorm([i.name.az, i.name.ru, i.name.en, i.group?.az, i.description].join(' ')).includes(nq)),
    );
    if (sort.key === 'default') {
      const order = new Map(menu.categories.map((c, n) => [c.id, n]));
      list = [...list].sort((a, b) => order.get(a.category)! - order.get(b.category)!); // stable: keeps order within a category
    } else {
      const val = (i: RawMenuItem) =>
        sort.key === 'name' ? i.name.az.toLocaleLowerCase('az') : sort.key === 'category' ? catName.get(i.category)?.name.az ?? '' : sort.key === 'price' ? i.price : Number(i.available);
      list = [...list].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir);
    }
    return list;
  }, [menu, q, cat, sort, catName]);

  const canReorder = sort.key === 'default' && !q.trim();

  const askDelete = useCallback(
    async (ids: string[]) => {
      const names = ids.map((id) => menu.items.find((i) => i.id === id)?.name.az).filter(Boolean) as string[];
      const combos = [...new Map(ids.flatMap((id) => usedInCombos(menu, id)).filter((c) => !ids.includes(c.id)).map((c) => [c.id, c])).values()];
      const ok = await confirm({
        title: names.length === 1 ? `${names[0]} silinsin?` : `${names.length} məhsul silinsin?`,
        body: (
          <>
            {names.length > 1 && <p className="mb-2 text-sm">{names.slice(0, 8).join(', ')}{names.length > 8 ? '…' : ''}</p>}
            <p>Bu geri qaytarıla bilər (Tarixçə). Yalnız müvəqqəti gizlətmək istəyirsinizsə, &quot;Bitib&quot; edin.</p>
            {combos.length > 0 && (
              <p className="mt-3 rounded-xl bg-gold/10 p-3 text-sm text-gold">
                ⚠ Bu setlərin tərkibində istifadə olunur: {combos.map((c) => c.name.az).join(', ')}. Silinsə, həmin setlərin tərkibindən də çıxarılacaq.
              </p>
            )}
          </>
        ),
        ok: 'Sil',
        danger: true,
      });
      if (!ok) return;
      setMenu((m) => deleteItems(m, ids));
      setSelected(new Set());
      if (editing && ids.includes(editing)) setEditing(null);
      toast(names.length === 1 ? `${names[0]} silindi (hələ yayımlanmayıb)` : `${names.length} məhsul silindi (hələ yayımlanmayıb)`);
    },
    [menu, confirm, setMenu, toast, editing],
  );

  // keyboard: "/" search, "N" new item
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing || isTyping(e) || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('[role="dialog"]')) return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setEditing('new');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing]);

  const toggleSel = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const setAvail = (ids: string[], v: boolean) => setMenu((m) => ids.reduce((acc, id) => updateItem(acc, id, { available: v }), m));

  const rowState = (i: RawMenuItem) => {
    const b = baseById.get(i.id);
    return !b ? 'new' : JSON.stringify(b) !== JSON.stringify(i) ? 'changed' : null;
  };
  const sortBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => setSort((s) => (s.key === key ? (s.dir === 1 ? { key, dir: -1 } : { key: 'default', dir: 1 }) : { key, dir: 1 }))}
      className="inline-flex items-center gap-1 font-semibold hover:text-cream"
    >
      {label}
      <span className="text-gold">{sort.key === key ? (sort.dir === 1 ? '↑' : '↓') : ''}</span>
    </button>
  );

  const counts = { all: menu.items.length, off: menu.items.filter((i) => !i.available).length };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase">Menyu</h1>
          <p className="text-sm text-mute">
            {counts.all} məhsul{counts.off > 0 && <> · <span className="text-[#ff7a70]">{counts.off} bitib</span></>}
          </p>
        </div>
        <div className="hidden gap-2 md:flex">
          <button onClick={() => setBulkOpen(true)} className={btn.ghost}>
            ± Toplu qiymət
          </button>
          <button onClick={() => setEditing('new')} className={btn.gold}>
            + Yeni məhsul <kbd className="rounded bg-black/20 px-1.5 text-xs">N</kbd>
          </button>
        </div>
      </div>

      {/* toolbar */}
      <div className="sticky top-[6.3rem] z-30 -mx-4 mt-4 flex flex-wrap gap-2 border-b border-white/5 bg-ink/95 px-4 py-3 backdrop-blur md:top-0 md:-mx-8 md:px-8">
        <label className="relative w-full min-w-0 md:w-auto md:flex-1">
          <span className="sr-only">Axtar</span>
          <input
            ref={searchRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && (setQ(''), e.currentTarget.blur())}
            placeholder="Axtar: çizburger, kola…  ( / )"
            className={`${input} pl-10`}
          />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute" aria-hidden>
            🔍
          </span>
        </label>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputBase} min-w-0 flex-1 basis-0 md:w-72 md:flex-none md:basis-auto`} aria-label="Kateqoriya filtri">
          <option value="all">Bütün kateqoriyalar</option>
          {menu.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name.az} ({menu.items.filter((i) => i.category === c.id).length})
            </option>
          ))}
        </select>
        <select
          value={`${sort.key}:${sort.dir}`}
          onChange={(e) => {
            const [key, dir] = e.target.value.split(':');
            setSort({ key: key as SortKey, dir: Number(dir) as 1 | -1 });
          }}
          className={`${inputBase} min-w-0 flex-1 basis-0 md:hidden`}
          aria-label="Sıralama"
        >
          <option value="default:1">Menyu sırası</option>
          <option value="name:1">Ad (A→Z)</option>
          <option value="price:1">Qiymət (ucuz→baha)</option>
          <option value="price:-1">Qiymət (baha→ucuz)</option>
          <option value="available:1">Əvvəlcə bitənlər</option>
        </select>
      </div>

      {/* bulk actions (desktop) */}
      {selected.size > 0 && (
        <div className="sticky top-[4.6rem] z-20 -mx-8 mb-2 hidden flex-wrap items-center gap-2 border-b border-gold/30 bg-[#1b160c] px-8 py-2.5 md:flex" role="region" aria-label="Toplu əməliyyatlar">
          <span className="mr-2 font-bold text-gold">{selected.size} seçildi</span>
          <button className={btn.ghost} onClick={() => setAvail([...selected], false)}>
            Bitib et
          </button>
          <button className={btn.ghost} onClick={() => setAvail([...selected], true)}>
            Mövcud et
          </button>
          <select
            className={inputBase}
            value=""
            aria-label="Kateqoriyanı dəyiş"
            onChange={(e) => {
              const to = e.target.value;
              if (!to) return;
              setMenu((m) => [...selected].reduce((acc, id) => updateItem(acc, id, { category: to, group: undefined }), m));
              toast(`${selected.size} məhsul "${catName.get(to)?.name.az}" kateqoriyasına köçürüldü`);
            }}
          >
            <option value="">Kateqoriyanı dəyiş…</option>
            {menu.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.az}
              </option>
            ))}
          </select>
          <button className={btn.ghost} onClick={() => setBulkOpen(true)}>
            ± Qiymət
          </button>
          <button className={btn.danger} onClick={() => askDelete([...selected])}>
            🗑 Sil
          </button>
          <button className="ml-auto text-sm text-mute hover:text-cream" onClick={() => setSelected(new Set())}>
            Seçimi təmizlə
          </button>
        </div>
      )}

      {rows.length === 0 && (
        <div className="py-16 text-center text-mute">
          <p className="text-lg">Heç nə tapılmadı.</p>
          <p className="mt-1 text-sm">Başqa söz yoxlayın və ya filtri təmizləyin.</p>
          <button onClick={() => (setQ(''), setCat('all'))} className={`${btn.ghost} mt-4`}>
            Filtri təmizlə
          </button>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <DesktopTable
            rows={rows}
            catName={catName}
            selected={selected}
            toggleSel={toggleSel}
            setSelected={setSelected}
            canReorder={canReorder}
            grouped={sort.key === 'default'}
            sortBtn={sortBtn}
            rowState={rowState}
            srcFor={srcFor}
            onEdit={setEditing}
            onDelete={askDelete}
            onAvail={(id, v) => setAvail([id], v)}
            onPlace={(id, before) => setMenu((m) => placeItem(m, id, before))}
          />
          <MobileList
            rows={rows}
            catName={catName}
            grouped={sort.key === 'default'}
            canReorder={canReorder}
            rowState={rowState}
            srcFor={srcFor}
            onEdit={setEditing}
            onAvail={(id, v) => setAvail([id], v)}
            onMove={(id, dir) => setMenu((m) => moveItem(m, id, dir))}
          />
        </>
      )}

      {/* phone: add button above the publish bar */}
      <button
        onClick={() => setEditing('new')}
        className="fixed bottom-[calc(var(--admin-bar-h,0px)+1rem)] right-4 z-40 grid size-14 place-items-center rounded-full bg-gold text-3xl font-bold text-ink shadow-2xl transition-[bottom] md:hidden"
        aria-label="Yeni məhsul"
      >
        +
      </button>

      {editing && (
        <ItemEditor
          id={editing}
          defaultCategory={cat !== 'all' ? cat : undefined}
          onClose={() => setEditing(null)}
          onDelete={askDelete}
          onOpen={setEditing}
        />
      )}
      {bulkOpen && <BulkPriceDialog selectedIds={[...selected]} onClose={() => setBulkOpen(false)} />}
    </div>
  );
}

type RowProps = {
  rows: RawMenuItem[];
  catName: Map<string, { name: { az: string }; icon: string }>;
  grouped: boolean;
  canReorder: boolean;
  rowState: (i: RawMenuItem) => 'new' | 'changed' | null;
  srcFor: (image?: string) => string | undefined;
  onEdit: (id: string) => void;
  onAvail: (id: string, v: boolean) => void;
};

function Thumb({ src, icon }: { src?: string; icon?: string }) {
  return src ? (
    // plain <img>: previews include photos that are only local data: URLs until published
    <img src={src} alt="" loading="lazy" className="size-11 shrink-0 rounded-lg object-cover" />
  ) : (
    <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-white/5 text-xl" aria-hidden>
      {icon}
    </span>
  );
}

function StateBadge({ s }: { s: 'new' | 'changed' | null }) {
  if (!s) return null;
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${s === 'new' ? 'bg-ok/20 text-ok' : 'bg-gold/15 text-gold'}`}>{s === 'new' ? 'yeni' : 'dəyişib'}</span>;
}

function withHeaders<T>(rows: RawMenuItem[], grouped: boolean, render: (i: RawMenuItem) => T, header: (cat: string) => T): T[] {
  const out: T[] = [];
  let last = '';
  for (const i of rows) {
    if (grouped && i.category !== last) out.push(header(i.category));
    last = i.category;
    out.push(render(i));
  }
  return out;
}

function DesktopTable({
  rows,
  catName,
  selected,
  toggleSel,
  setSelected,
  canReorder,
  grouped,
  sortBtn,
  rowState,
  srcFor,
  onEdit,
  onDelete,
  onAvail,
  onPlace,
}: RowProps & {
  selected: Set<string>;
  toggleSel: (id: string) => void;
  setSelected: (s: Set<string>) => void;
  sortBtn: (k: SortKey, l: string) => React.ReactNode;
  onDelete: (ids: string[]) => void;
  onPlace: (id: string, before: string | null) => void;
}) {
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const allSel = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const dragCat = drag ? rows.find((r) => r.id === drag)?.category : null;

  const drop = (target: RawMenuItem) => {
    if (!drag || drag === target.id) return;
    const ids = rows.filter((r) => r.category === target.category).map((r) => r.id);
    const from = ids.indexOf(drag);
    const to = ids.indexOf(target.id);
    // dragging down lands after the target, dragging up lands before it
    onPlace(drag, from < to ? (ids[to + 1] ?? null) : target.id);
  };

  return (
    <div className="hidden md:block">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-mute">
          <tr>
            <th className="w-10 py-2 pl-2">
              <input
                type="checkbox"
                aria-label="Hamısını seç"
                checked={allSel}
                onChange={() => setSelected(allSel ? new Set() : new Set(rows.map((r) => r.id)))}
                className="size-4 accent-[#f29a1f]"
              />
            </th>
            {canReorder && <th className="w-8" aria-label="Sırala" />}
            <th className="py-2">{sortBtn('name', 'Məhsul')}</th>
            <th className="py-2">{sortBtn('category', 'Kateqoriya')}</th>
            <th className="py-2 text-right">{sortBtn('price', 'Qiymət ₼')}</th>
            <th className="py-2 text-right">Köhnə qiymət</th>
            <th className="py-2 text-center">{sortBtn('available', 'Mövcud')}</th>
            <th className="py-2 pr-2 text-right">Əməliyyat</th>
          </tr>
        </thead>
        <tbody>
          {withHeaders(
            rows,
            grouped,
            (i) => {
              const st = rowState(i);
              const c = catName.get(i.category);
              const isOver = over === i.id && drag && dragCat === i.category;
              return (
                <tr
                  key={i.id}
                  data-testid={`row-${i.id}`}
                  onDragOver={(e) => {
                    if (drag && dragCat === i.category) {
                      e.preventDefault();
                      setOver(i.id);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    drop(i);
                    setDrag(null);
                    setOver(null);
                  }}
                  className={`group ${!i.available ? 'opacity-55' : ''} ${selected.has(i.id) ? 'bg-gold/[.06]' : 'hover:bg-white/[.03]'} ${isOver ? 'outline outline-2 -outline-offset-2 outline-gold' : ''}`}
                >
                  <td className={`border-b border-white/5 py-2 pl-2 ${st ? 'border-l-2 border-l-gold' : ''}`}>
                    <input type="checkbox" aria-label={`${i.name.az} seç`} checked={selected.has(i.id)} onChange={() => toggleSel(i.id)} className="size-4 accent-[#f29a1f]" />
                  </td>
                  {canReorder && (
                    <td className="border-b border-white/5">
                      <span
                        draggable
                        onDragStart={(e) => {
                          setDrag(i.id);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', i.id);
                        }}
                        onDragEnd={() => (setDrag(null), setOver(null))}
                        className="cursor-grab select-none px-1 text-lg text-mute hover:text-cream active:cursor-grabbing"
                        title="Sürükləyib yerini dəyişin"
                        aria-hidden
                      >
                        ⋮⋮
                      </span>
                    </td>
                  )}
                  <td className="border-b border-white/5 py-2">
                    <button onClick={() => onEdit(i.id)} className="flex items-center gap-3 text-left">
                      <Thumb src={srcFor(i.image)} icon={c?.icon} />
                      <span>
                        <span className="flex flex-wrap items-center gap-1.5 font-semibold">
                          {i.name.az}
                          {i.group && <span className="text-xs font-normal text-mute">· {i.group.az}</span>}
                          <StateBadge s={st} />
                        </span>
                        {i.tags.length > 0 && <span className="text-xs text-mute">{i.tags.map((t) => TAG_LABEL[t]).join(' · ')}</span>}
                      </span>
                    </button>
                  </td>
                  <td className="border-b border-white/5 py-2 text-mute">{c?.name.az}</td>
                  <td className="border-b border-white/5 py-2 text-right">
                    <PriceInput item={i} col="price" list="desk" />
                  </td>
                  <td className="border-b border-white/5 py-2 text-right">
                    <PriceInput item={i} col="oldPrice" list="desk" />
                  </td>
                  <td className="border-b border-white/5 py-2 text-center">
                    <Switch on={i.available} onChange={(v) => onAvail(i.id, v)} label={`${i.name.az}: mövcuddur`} />
                  </td>
                  <td className="whitespace-nowrap border-b border-white/5 py-2 pr-2 text-right">
                    <button onClick={() => onEdit(i.id)} className={btn.icon} aria-label={`${i.name.az}: redaktə et`} title="Redaktə et">
                      ✎
                    </button>
                    <button onClick={() => onDelete([i.id])} className={btn.icon} aria-label={`${i.name.az}: sil`} title="Sil">
                      🗑
                    </button>
                  </td>
                </tr>
              );
            },
            (catId) => (
              <tr key={`h-${catId}`}>
                <th colSpan={canReorder ? 8 : 7} className="pb-2 pt-6 text-left font-display text-lg uppercase tracking-wide text-cream">
                  {catName.get(catId)?.icon} {catName.get(catId)?.name.az}
                </th>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}

function MobileList({ rows, catName, grouped, canReorder, rowState, srcFor, onEdit, onAvail, onMove }: RowProps & { onMove: (id: string, dir: -1 | 1) => void }) {
  return (
    <div className="grid gap-2 md:hidden">
      {withHeaders(
        rows,
        grouped,
        (i) => {
          const st = rowState(i);
          const sameCat = rows.filter((r) => r.category === i.category);
          const pos = sameCat.indexOf(i);
          return (
            <div
              key={i.id}
              data-testid={`card-${i.id}`}
              className={`rounded-2xl border bg-card p-3 ${st ? 'border-gold/40' : 'border-white/5'} ${!i.available ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3">
                <button onClick={() => onEdit(i.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`${i.name.az}: redaktə et`}>
                  <Thumb src={srcFor(i.image)} icon={catName.get(i.category)?.icon} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{i.name.az}</span>
                    <span className="flex items-center gap-1.5 text-xs text-mute">
                      {i.group?.az}
                      <StateBadge s={st} />
                      {!i.available && <span className="font-bold text-[#ff7a70]">Bitib</span>}
                    </span>
                  </span>
                </button>
                <Switch on={i.available} onChange={(v) => onAvail(i.id, v)} label={`${i.name.az}: mövcuddur`} size="lg" />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <PriceInput item={i} col="price" list="mob" className="min-h-11 w-28 text-lg" />
                <span className="text-mute">₼</span>
                {i.oldPrice !== undefined && <s className="text-sm text-mute">{i.oldPrice.toFixed(2)}</s>}
                <div className="ml-auto flex">
                  {canReorder && (
                    <>
                      <button onClick={() => onMove(i.id, -1)} disabled={pos === 0} className={btn.icon} aria-label={`${i.name.az}: yuxarı`}>
                        ↑
                      </button>
                      <button onClick={() => onMove(i.id, 1)} disabled={pos === sameCat.length - 1} className={btn.icon} aria-label={`${i.name.az}: aşağı`}>
                        ↓
                      </button>
                    </>
                  )}
                  <button onClick={() => onEdit(i.id)} className={btn.icon} aria-label={`${i.name.az}: redaktə et`}>
                    ✎
                  </button>
                </div>
              </div>
            </div>
          );
        },
        (catId) => (
          <h2 key={`h-${catId}`} className="mt-5 font-display text-xl uppercase first:mt-2">
            {catName.get(catId)?.icon} {catName.get(catId)?.name.az}
          </h2>
        ),
      )}
    </div>
  );
}

function BulkPriceDialog({ selectedIds, onClose }: { selectedIds: string[]; onClose: () => void }) {
  const { menu, setMenu, toast } = useAdmin();
  const [scope, setScope] = useState<string>(selectedIds.length ? 'selected' : menu.categories[0].id);
  const [mode, setMode] = useState<BulkOp['mode']>('amount');
  const [raw, setRaw] = useState('');
  const [roundTo10, setRoundTo10] = useState(false);

  const value = Number(raw.trim().replace(',', '.'));
  const valid = raw.trim() !== '' && Number.isFinite(value) && value !== 0;
  const ids = scope === 'selected' ? selectedIds : menu.items.filter((i) => i.category === scope).map((i) => i.id);
  const preview = valid ? previewBulk(menu, ids, { mode, value, roundTo10 }) : [];
  const problems = preview.filter((p) => p.problem);

  return (
    <Dialog open onClose={onClose} title="Toplu qiymət dəyişikliyi" wide>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold">
          Hansı məhsullar
          <select className={input} value={scope} onChange={(e) => setScope(e.target.value)} data-autofocus>
            {selectedIds.length > 0 && <option value="selected">Seçilmiş məhsullar ({selectedIds.length})</option>}
            {menu.categories.map((c) => (
              <option key={c.id} value={c.id}>
                Bütün {c.name.az} ({menu.items.filter((i) => i.category === c.id).length})
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-1.5 text-sm font-semibold">
          Nə qədər
          <div className="flex gap-2">
            <input
              className={input}
              inputMode="decimal"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={mode === 'amount' ? 'məs. 0.50 və ya -0.30' : 'məs. 10 və ya -5'}
              aria-label="Dəyişiklik miqdarı"
            />
            <div className="flex overflow-hidden rounded-xl border border-white/15" role="group" aria-label="Növ">
              {(['amount', 'percent'] as const).map((m) => (
                <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={`min-w-12 px-3 font-bold ${mode === m ? 'bg-gold text-ink' : ''}`}>
                  {m === 'amount' ? '₼' : '%'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={roundTo10} onChange={(e) => setRoundTo10(e.target.checked)} className="size-4 accent-[#f29a1f]" />
        Qiymətləri 0.10-a yuvarlaqlaşdır (məs. 6.38 → 6.40)
      </label>

      {valid && (
        <div className="mt-4">
          <p className="text-sm font-semibold">
            Önizləmə: {preview.length} məhsulun qiyməti dəyişəcək
            {problems.length > 0 && <span className="text-[#ff7a70]"> · {problems.length} problem</span>}
          </p>
          <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-white/10">
            <table className="w-full text-sm" data-testid="bulk-preview">
              <tbody>
                {preview.map((p) => (
                  <tr key={p.id} className={`border-b border-white/5 ${p.problem ? 'bg-red/10' : ''}`}>
                    <td className="px-3 py-2">
                      {p.name}
                      {p.problem && <span className="block text-xs text-[#ff7a70]">{p.problem}</span>}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-mute">{p.from.toFixed(2)}</td>
                    <td className="px-1 text-mute">→</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums text-gold">{p.to.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className={btn.ghost}>
          İmtina
        </button>
        <button
          disabled={!valid || !preview.length || problems.length > 0}
          onClick={() => {
            setMenu((m) => applyBulkPrices(m, preview));
            toast(`${preview.length} məhsulun qiyməti dəyişdi (hələ yayımlanmayıb)`);
            onClose();
          }}
          className={btn.gold}
        >
          {preview.length ? `${preview.length} qiyməti dəyiş` : 'Tətbiq et'}
        </button>
      </div>
    </Dialog>
  );
}
