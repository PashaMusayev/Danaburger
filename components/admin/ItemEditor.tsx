'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TAGS, type CatalogItem, type Tag } from '@/lib/menu';
import { parsePrice, isSuspiciousChange } from '@/lib/admin/price';
import { addProduct, duplicateProduct, setSold, updateCatalogItem, updateEntry, type NewEntry } from '@/lib/admin/ops';
import { duplicateName, validateEntry, validateItem, type FieldErrors } from '@/lib/admin/validate';
import { branchName, type AdminData } from '@/lib/admin/model';
import { slugify } from '@/lib/admin/slug';
import { useAdmin } from './AdminStore';
import { resizeImage } from './image';
import { Field, Switch, btn, input } from './ui';

export const TAG_LABEL: Record<Tag, string> = { popular: 'Populyar', new: 'Yeni', spicy: 'Acılı', chicken: 'Toyuq', meat: 'Ət', veg: 'Vegetarian' };

/** One branch's part of the form. */
type BranchForm = { sold: boolean; price: string; oldPrice: string; available: boolean; ownDesc: boolean; description: string };

type Form = {
  category: string;
  group: string; // az group name, '' = none
  az: string;
  ru: string;
  en: string;
  description: string;
  tags: Tag[];
  image: string;
  branches: Record<string, BranchForm>;
};

const money = (n?: number) => (n === undefined ? '' : n.toFixed(2));

function toForm(d: AdminData, i: CatalogItem | undefined, category: string, currentBranch: string): Form {
  return {
    category: i?.category ?? category,
    group: i?.group?.az ?? '',
    az: i?.name.az ?? '',
    ru: i?.name.ru ?? '',
    en: i?.name.en ?? '',
    description: i?.description ?? '',
    tags: i?.tags ?? [],
    image: i?.image ?? '',
    branches: Object.fromEntries(
      Object.entries(d.menus).map(([b, m]) => {
        const e = i && m.items.find((x) => x.id === i.id);
        return [
          b,
          {
            // a new product starts as sold at the branch the owner is looking at
            sold: e ? true : !i && b === currentBranch,
            price: money(e?.price),
            oldPrice: money(e?.oldPrice),
            available: e?.available ?? true,
            ownDesc: e?.description !== undefined,
            description: e?.description ?? '',
          },
        ];
      }),
    ),
  };
}

type Errors = FieldErrors & Partial<Record<`${string}.price` | `${string}.oldPrice`, string>>;

/** Opens as a right-hand panel on desktop and a full-screen sheet on phones. */
export default function ItemEditor({
  id,
  defaultCategory,
  onClose,
  onDelete,
  onOpen,
}: {
  id: string | 'new';
  defaultCategory?: string;
  onClose: () => void;
  onDelete: (ids: string[]) => void;
  onOpen: (id: string) => void;
}) {
  const { data, update, branch: current, toast, confirm, addImage, srcFor } = useAdmin();
  const existing = id === 'new' ? undefined : data.catalog.items.find((i) => i.id === id);
  const [f, setF] = useState<Form>(() => toForm(data, existing, defaultCategory ?? 'burgers', current));
  const [errors, setErrors] = useState<Errors>({});
  const [busyImg, setBusyImg] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setF(toForm(data, existing, defaultCategory ?? 'burgers', current));
    setErrors({});
    firstRef.current?.focus();
    // re-init only when switching to another item
  }, [id]);

  const cats = data.catalog.categories;
  const branchIds = Object.keys(data.menus);
  const groups = useMemo(() => {
    const seen = new Map<string, CatalogItem['group']>();
    for (const i of data.catalog.items) if (i.category === f.category && i.group) seen.set(i.group.az, i.group);
    return [...seen.values()];
  }, [data.catalog.items, f.category]);

  const build = (): { item: CatalogItem; entries: Record<string, NewEntry | null> } | null => {
    const group = groups.find((g) => g?.az === f.group);
    const item: CatalogItem = {
      id: existing?.id ?? '__new__',
      category: f.category,
      ...(group && { group }),
      name: { az: f.az.trim(), ru: f.ru.trim(), en: f.en.trim() },
      description: f.description.trim(),
      ...(f.image && { image: f.image }),
      tags: f.tags,
      ...(existing?.includes && { includes: existing.includes }),
    };
    const e: Errors = validateItem(item, new Set(cats.map((c) => c.id)));
    const entries: Record<string, NewEntry | null> = {};
    for (const [b, bf] of Object.entries(f.branches)) {
      if (!bf.sold) {
        entries[b] = null;
        continue;
      }
      const price = parsePrice(bf.price);
      const oldPrice = bf.oldPrice.trim() ? parsePrice(bf.oldPrice) : undefined;
      if (!bf.price.trim()) e[`${b}.price`] = 'Qiymət yazın.';
      else if (price === null) e[`${b}.price`] = 'Qiymət düzgün deyil. Nümunə: 5.80';
      if (oldPrice === null) e[`${b}.oldPrice`] = 'Köhnə qiymət düzgün deyil.';
      else if (price !== null && oldPrice !== undefined) {
        const v = validateEntry({ price, oldPrice });
        if (v.oldPrice) e[`${b}.oldPrice`] = v.oldPrice;
      }
      entries[b] = {
        price: price ?? NaN,
        ...(oldPrice != null && { oldPrice }),
        available: bf.available,
        ...(bf.ownDesc && { description: bf.description.trim() }),
      };
    }
    setErrors(e);
    return Object.keys(e).length ? null : { item, entries };
  };

  const save = async () => {
    const built = build();
    if (!built) {
      toast('Formada səhvlər var.', 'error');
      return;
    }
    const { item, entries } = built;
    if (duplicateName(item, data.catalog.items)) {
      const ok = await confirm({ title: 'Eyni adda məhsul var', body: `Bu kateqoriyada artıq "${item.name.az}" var. Yenə də saxlanılsın?`, ok: 'Saxla' });
      if (!ok) return;
    }
    if (existing) {
      for (const [b, e] of Object.entries(entries)) {
        const before = data.menus[b].items.find((x) => x.id === existing.id);
        if (e && before && isSuspiciousChange(before.price, e.price)) {
          const ok = await confirm({ title: 'Qiymət çox dəyişir', body: `${branchName(data, b)}: ${before.price.toFixed(2)} → ${e.price.toFixed(2)} ₼. Əminsiniz?`, ok: 'Bəli, dəyiş' });
          if (!ok) return;
        }
      }
      const { id: _, ...patch } = item;
      void _;
      update((d) => {
        let out = updateCatalogItem(d, existing.id, { ...patch, group: item.group, image: item.image });
        for (const [b, e] of Object.entries(entries)) {
          const has = out.menus[b].items.some((x) => x.id === existing.id);
          if (!e) out = has ? setSold(out, b, existing.id, null) : out;
          else out = has ? updateEntry(out, b, existing.id, { ...e, oldPrice: e.oldPrice, description: e.description }) : setSold(out, b, existing.id, e);
        }
        return out;
      });
    } else {
      const { id: _, ...draft } = item;
      void _;
      const perBranch = Object.fromEntries(Object.entries(entries).filter(([, e]) => e)) as Record<string, NewEntry>;
      update((d) => addProduct(d, draft, perBranch).data);
    }
    const nowhere = Object.values(entries).every((e) => !e);
    toast(
      nowhere
        ? 'Yadda saxlanıldı. Heç bir filialda satılmır, saytda görünməyəcək.'
        : existing
          ? 'Yadda saxlanıldı (hələ yayımlanmayıb)'
          : 'Məhsul əlavə olundu (hələ yayımlanmayıb)',
      nowhere ? 'info' : 'ok',
    );
    onClose();
  };

  /** "Hamısına eyni qiymət": copy this branch's price to every branch and mark them all as selling it. */
  const sameEverywhere = () => {
    const src = f.branches[current]?.price.trim() ? f.branches[current] : Object.values(f.branches).find((x) => x.price.trim());
    if (!src) return toast('Əvvəlcə bir filial üçün qiymət yazın.', 'error');
    setF((x) => ({
      ...x,
      branches: Object.fromEntries(Object.entries(x.branches).map(([b, bf]) => [b, { ...bf, sold: true, price: src.price, oldPrice: src.oldPrice }])),
    }));
  };
  const setB = (b: string, patch: Partial<BranchForm>) => setF((x) => ({ ...x, branches: { ...x.branches, [b]: { ...x.branches[b], ...patch } } }));

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusyImg(true);
    try {
      const { dataUrl, ext } = await resizeImage(file);
      const name = slugify(f.az || 'foto') || 'foto';
      const path = `/img/u/${name}-${Date.now().toString(36)}.${ext}`;
      addImage(`public${path}`, dataUrl);
      setF((x) => ({ ...x, image: path }));
    } catch (e) {
      toast((e as Error).message || 'Şəkli oxumaq olmadı.', 'error');
    } finally {
      setBusyImg(false);
    }
  };

  // Esc closes, Ctrl/Cmd+S saves the item
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"][aria-modal="true"]:not([data-editor])')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // preview shows the branch the owner is looking at (or the first one that sells it)
  const pb = f.branches[current]?.sold ? current : (branchIds.find((b) => f.branches[b]?.sold) ?? current);
  const pf = f.branches[pb];
  const preview = {
    branch: branchName(data, pb),
    name: f.az || 'Məhsulun adı',
    desc: pf?.ownDesc ? pf.description : f.description,
    price: pf ? parsePrice(pf.price) : null,
    old: pf?.oldPrice.trim() ? parsePrice(pf.oldPrice) : null,
    img: srcFor(f.image),
    available: pf?.sold ? pf.available : false,
  };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" data-editor-open data-editor role="dialog" aria-modal="true" aria-label={existing ? `${existing.name.az}: redaktə` : 'Yeni məhsul'}>
      <div className="absolute inset-0 hidden bg-black/60 md:block" onClick={onClose} />
      <div className="relative flex h-full w-full flex-col bg-[#121212] md:max-w-2xl md:border-l md:border-white/10">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-6">
          <h2 className="text-lg font-bold">{existing ? 'Məhsulu redaktə et' : 'Yeni məhsul'}</h2>
          <button onClick={onClose} className={btn.icon} aria-label="Bağla (Esc)">
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
              noValidate
            >
              <p className="rounded-xl bg-white/5 px-3 py-2 text-xs text-mute">
                Ad, foto, kateqoriya, etiketlər və tərkib <b className="text-cream">{branchIds.length} filialın hamısına aiddir</b>. Qiymətlər aşağıda filial-filial yazılır.
              </p>
              <Field label="Ad (AZ) *" error={errors.name} htmlFor="f-az">
                <input id="f-az" ref={firstRef} className={input} value={f.az} aria-invalid={!!errors.name} onChange={(e) => set('az', e.target.value)} placeholder="məs. Çizburger" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ad (RU)" hint="Boş qalsa, AZ ad göstərilir" htmlFor="f-ru">
                  <input id="f-ru" className={input} value={f.ru} onChange={(e) => set('ru', e.target.value)} />
                </Field>
                <Field label="Ad (EN)" hint="Boş qalsa, AZ ad göstərilir" htmlFor="f-en">
                  <input id="f-en" className={input} value={f.en} onChange={(e) => set('en', e.target.value)} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Kateqoriya *" error={errors.category} htmlFor="f-cat">
                  <select id="f-cat" className={input} value={f.category} onChange={(e) => setF((x) => ({ ...x, category: e.target.value, group: '' }))}>
                    {cats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name.az}
                      </option>
                    ))}
                  </select>
                </Field>
                {groups.length > 0 && (
                  <Field label="Qrup" htmlFor="f-group">
                    <select id="f-group" className={input} value={f.group} onChange={(e) => set('group', e.target.value)}>
                      <option value="">Qrupsuz</option>
                      {groups.map((g) => (
                        <option key={g!.az} value={g!.az}>
                          {g!.az}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </div>
              <Field label="Tərkib (bütün filiallar)" hint="Bir filialda fərqlidirsə, aşağıda həmin filial üçün ayrıca yazın" htmlFor="f-desc">
                <textarea id="f-desc" rows={3} className={input} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="məs. Çəkilmiş mal əti 100 qr, pomidor, pendir" />
              </Field>
              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold">Etiketlər</legend>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((t) => {
                    const on = f.tags.includes(t);
                    return (
                      <button
                        type="button"
                        key={t}
                        aria-pressed={on}
                        onClick={() => set('tags', on ? f.tags.filter((x) => x !== t) : [...f.tags, t])}
                        className={`min-h-10 rounded-full border px-3.5 text-sm font-semibold transition ${on ? 'border-gold bg-gold/15 text-gold' : 'border-white/15 text-cream/80'}`}
                      >
                        {on ? '✓ ' : ''}
                        {TAG_LABEL[t]}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="grid gap-3" data-testid="branch-prices">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <legend className="text-sm font-semibold">Filiallar və qiymətlər</legend>
                  <button type="button" onClick={sameEverywhere} className="text-sm font-bold text-gold hover:underline">
                    ⇉ Hamısına eyni qiymət
                  </button>
                </div>
                {branchIds.map((b) => {
                  const bf = f.branches[b];
                  const bn = branchName(data, b);
                  return (
                    <div key={b} data-testid={`branch-form-${b}`} className={`rounded-2xl border p-3.5 ${bf.sold ? 'border-white/15 bg-white/[.02]' : 'border-dashed border-white/10'}`}>
                      <label className="flex items-center justify-between gap-3">
                        <span className={`font-bold ${b === current ? 'text-gold' : ''}`}>📍 {bn}</span>
                        <span className="flex items-center gap-2 text-sm text-mute">
                          {bf.sold ? 'Bu filialda satılır' : 'Satılmır'}
                          <Switch on={bf.sold} onChange={(v) => setB(b, { sold: v })} label={`${bn}: bu filialda satılır`} />
                        </span>
                      </label>
                      {bf.sold && (
                        <div className="mt-3 grid gap-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Qiymət (₼) *" error={errors[`${b}.price`]} htmlFor={`f-${b}-price`}>
                              <input id={`f-${b}-price`} inputMode="decimal" className={input} value={bf.price} aria-invalid={!!errors[`${b}.price`]} onChange={(e) => setB(b, { price: e.target.value })} placeholder="5.80" />
                            </Field>
                            <Field label="Köhnə qiymət (₼)" hint="Endirim üçün" error={errors[`${b}.oldPrice`]} htmlFor={`f-${b}-old`}>
                              <input id={`f-${b}-old`} inputMode="decimal" className={input} value={bf.oldPrice} aria-invalid={!!errors[`${b}.oldPrice`]} onChange={(e) => setB(b, { oldPrice: e.target.value })} placeholder="—" />
                            </Field>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-sm">
                              <Switch on={bf.available} onChange={(v) => setB(b, { available: v })} label={`${bn}: mövcuddur`} />
                              {bf.available ? 'Mövcuddur' : <span className="text-[#ff7a70]">Bitib (müvəqqəti gizlədilib)</span>}
                            </label>
                            <label className="flex items-center gap-2 text-sm text-mute">
                              <input type="checkbox" className="size-4 accent-[#f29a1f]" checked={bf.ownDesc} onChange={(e) => setB(b, { ownDesc: e.target.checked, description: bf.description || f.description })} />
                              Bu filialda fərqli tərkib
                            </label>
                          </div>
                          {bf.ownDesc && (
                            <textarea aria-label={`${bn}: tərkib`} rows={2} className={input} value={bf.description} onChange={(e) => setB(b, { description: e.target.value })} />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </fieldset>

              <div>
                <p className="mb-1.5 text-sm font-semibold">Foto</p>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    void onFile(e.dataTransfer.files[0]);
                  }}
                  className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-4 text-center transition ${dragOver ? 'border-gold bg-gold/10' : 'border-white/15'}`}
                >
                  {preview.img ? (
                    <img src={preview.img} alt="" className="aspect-[4/3] w-full max-w-xs rounded-xl object-cover" />
                  ) : (
                    <p className="text-sm text-mute">
                      <span className="hidden md:inline">Şəkli bura sürükləyib atın və ya </span>seçin. Avtomatik kiçildilir.
                    </p>
                  )}
                  <div className="flex flex-wrap justify-center gap-2">
                    <button type="button" disabled={busyImg} onClick={() => fileRef.current?.click()} className={btn.ghost}>
                      {busyImg ? 'Hazırlanır…' : preview.img ? '📷 Fotonu dəyiş' : '📷 Foto seç'}
                    </button>
                    {f.image && (
                      <button type="button" onClick={() => set('image', '')} className={btn.ghost}>
                        Fotonu sil
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    data-testid="photo-input"
                    onChange={(e) => {
                      void onFile(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>

              {existing?.includes && <p className="rounded-xl bg-white/5 p-3 text-xs text-mute">Bu setin tərkibi səbətdəki &quot;setə keç&quot; təklifi üçün istifadə olunur və avtomatik saxlanılır.</p>}
              <button type="submit" className="hidden" />
            </form>

            {/* live preview: how the card looks on the site */}
            <aside aria-label="Önizləmə">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-mute">Saytda belə görünəcək · {preview.branch}</p>
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-card">
                <div className="relative aspect-[4/3] bg-card-2">
                  {preview.img ? (
                    <img src={preview.img} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center text-4xl" style={{ background: 'radial-gradient(120% 90% at 20% 10%, rgba(242,154,31,.28), transparent 55%), radial-gradient(100% 80% at 90% 100%, rgba(215,38,30,.35), transparent 60%), #171717' }}>
                      {cats.find((c) => c.id === f.category)?.icon}
                    </div>
                  )}
                  {preview.old && preview.price && preview.old > preview.price && (
                    <span className="absolute left-2 top-2 rounded-full bg-red px-2 py-0.5 text-xs font-extrabold text-white">−{(preview.old - preview.price).toFixed(2)} ₼ qənaət</span>
                  )}
                  {!preview.available && <span className="absolute inset-0 grid place-items-center bg-black/70 font-bold">Bitib · saytda görünmür</span>}
                </div>
                <div className="p-3">
                  <p className="font-bold leading-snug">{preview.name}</p>
                  {preview.desc && <p className="mt-1 line-clamp-2 text-xs text-mute">{preview.desc}</p>}
                  <div className="mt-2 flex items-end justify-between">
                    <span className="leading-none">
                      {preview.old && <s className="block text-xs text-mute decoration-red decoration-2">{preview.old.toFixed(2)} ₼</s>}
                      <span className="font-display text-xl text-gold">{preview.price ? preview.price.toFixed(2) : '0.00'} ₼</span>
                    </span>
                    <span className="grid size-9 place-items-center rounded-xl bg-red text-xl font-bold text-white">+</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] md:px-6">
          {existing && (
            <>
              <button type="button" onClick={() => onDelete([existing.id])} className={btn.danger}>
                🗑 Hər yerdən sil
              </button>
              <button
                type="button"
                onClick={() => {
                  const copy = duplicateProduct(data, existing.id);
                  update(() => copy.data);
                  toast('Kopya yaradıldı. İndi onu redaktə edirsiniz.');
                  onOpen(copy.id);
                }}
                className={btn.ghost}
              >
                ⧉ Kopyala
              </button>
            </>
          )}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} className={btn.ghost}>
              Ləğv et
            </button>
            <button type="button" onClick={() => void save()} className={btn.gold} data-testid="save-item">
              Yadda saxla
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
