'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TAGS, type RawMenuItem, type Tag } from '@/lib/menu';
import { parsePrice, isSuspiciousChange } from '@/lib/admin/price';
import { addItem, duplicateItem, updateItem } from '@/lib/admin/ops';
import { duplicateName, validateItem, type FieldErrors } from '@/lib/admin/validate';
import { slugify } from '@/lib/admin/slug';
import { useAdmin } from './AdminStore';
import { resizeImage } from './image';
import { Field, Switch, btn, input } from './ui';

export const TAG_LABEL: Record<Tag, string> = { popular: 'Populyar', new: 'Yeni', spicy: 'Acılı', chicken: 'Toyuq', meat: 'Ət', veg: 'Vegetarian' };

type Form = {
  category: string;
  group: string; // az group name, '' = none
  az: string;
  ru: string;
  en: string;
  description: string;
  price: string;
  oldPrice: string;
  tags: Tag[];
  available: boolean;
  image: string;
};

const toForm = (i?: RawMenuItem, category = 'burgers'): Form => ({
  category: i?.category ?? category,
  group: i?.group?.az ?? '',
  az: i?.name.az ?? '',
  ru: i?.name.ru ?? '',
  en: i?.name.en ?? '',
  description: i?.description ?? '',
  price: i ? i.price.toFixed(2) : '',
  oldPrice: i?.oldPrice !== undefined ? i.oldPrice.toFixed(2) : '',
  tags: i?.tags ?? [],
  available: i?.available ?? true,
  image: i?.image ?? '',
});

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
  const { menu, setMenu, toast, confirm, addImage, srcFor } = useAdmin();
  const existing = id === 'new' ? undefined : menu.items.find((i) => i.id === id);
  const [f, setF] = useState<Form>(() => toForm(existing, defaultCategory));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busyImg, setBusyImg] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setF(toForm(existing, defaultCategory));
    setErrors({});
    firstRef.current?.focus();
    // re-init only when switching to another item
  }, [id]);

  const cats = menu.categories;
  const groups = useMemo(() => {
    const seen = new Map<string, RawMenuItem['group']>();
    for (const i of menu.items) if (i.category === f.category && i.group) seen.set(i.group.az, i.group);
    return [...seen.values()];
  }, [menu.items, f.category]);

  const build = (): RawMenuItem | null => {
    const price = parsePrice(f.price);
    const oldPrice = f.oldPrice.trim() ? parsePrice(f.oldPrice) : undefined;
    const group = groups.find((g) => g?.az === f.group);
    const item: RawMenuItem = {
      id: existing?.id ?? '__new__',
      category: f.category,
      ...(group && { group }),
      name: { az: f.az.trim(), ru: f.ru.trim(), en: f.en.trim() },
      description: f.description.trim(),
      price: price ?? NaN,
      ...(oldPrice !== undefined && { oldPrice: oldPrice ?? NaN }),
      ...(f.image && { image: f.image }),
      tags: f.tags,
      available: f.available,
      ...(existing?.includes && { includes: existing.includes }),
    };
    const e = validateItem(item, new Set(cats.map((c) => c.id)));
    if (f.price.trim() && price === null) e.price = 'Qiymət düzgün deyil. Nümunə: 5.80';
    if (!f.price.trim()) e.price = 'Qiymət yazın.';
    setErrors(e);
    return Object.keys(e).length ? null : item;
  };

  const save = async () => {
    const item = build();
    if (!item) {
      toast('Formada səhvlər var.', 'error');
      return;
    }
    if (duplicateName(item, menu.items)) {
      const ok = await confirm({ title: 'Eyni adda məhsul var', body: `Bu kateqoriyada artıq "${item.name.az}" var. Yenə də saxlanılsın?`, ok: 'Saxla' });
      if (!ok) return;
    }
    if (existing && isSuspiciousChange(existing.price, item.price)) {
      const ok = await confirm({ title: 'Qiymət çox dəyişir', body: `${existing.price.toFixed(2)} → ${item.price.toFixed(2)} ₼. Əminsiniz?`, ok: 'Bəli, dəyiş' });
      if (!ok) return;
    }
    if (existing) {
      const { id: _, ...patch } = item;
      void _;
      setMenu((m) =>
        updateItem(m, existing.id, { ...patch, group: item.group, oldPrice: item.oldPrice, image: item.image }),
      );
    } else {
      const { id: _, ...draft } = item;
      void _;
      setMenu((m) => addItem(m, draft).menu);
    }
    toast(existing ? 'Yadda saxlanıldı (hələ yayımlanmayıb)' : 'Məhsul əlavə olundu (hələ yayımlanmayıb)');
    onClose();
  };

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

  const preview = {
    name: f.az || 'Məhsulun adı',
    desc: f.description,
    price: parsePrice(f.price),
    old: f.oldPrice.trim() ? parsePrice(f.oldPrice) : null,
    img: srcFor(f.image),
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
              <Field label="Tərkib" htmlFor="f-desc">
                <textarea id="f-desc" rows={3} className={input} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="məs. Çəkilmiş mal əti 100 qr, pomidor, pendir" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Qiymət (₼) *" error={errors.price} htmlFor="f-price">
                  <input id="f-price" inputMode="decimal" className={input} value={f.price} aria-invalid={!!errors.price} onChange={(e) => set('price', e.target.value)} placeholder="5.80" />
                </Field>
                <Field label="Köhnə qiymət (₼)" hint="Endirim üçün. Boş = endirim yoxdur" error={errors.oldPrice} htmlFor="f-old">
                  <input id="f-old" inputMode="decimal" className={input} value={f.oldPrice} aria-invalid={!!errors.oldPrice} onChange={(e) => set('oldPrice', e.target.value)} placeholder="—" />
                </Field>
              </div>

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

              <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
                <div>
                  <p className="font-semibold">{f.available ? 'Mövcuddur' : 'Bitib'}</p>
                  <p className="text-xs text-mute">{f.available ? 'Saytda görünür' : 'Saytdan gizlədilib, silinməyib'}</p>
                </div>
                <Switch on={f.available} onChange={(v) => set('available', v)} label="Mövcuddur" size="lg" />
              </div>

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
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-mute">Saytda belə görünəcək</p>
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
                  {!f.available && <span className="absolute inset-0 grid place-items-center bg-black/70 font-bold">Bitib · saytda görünmür</span>}
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
                🗑 Sil
              </button>
              <button
                type="button"
                onClick={() => {
                  const copy = duplicateItem(menu, existing.id);
                  setMenu(() => copy.menu);
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
