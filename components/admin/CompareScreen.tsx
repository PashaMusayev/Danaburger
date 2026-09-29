'use client';

import { useMemo, useState } from 'react';
import { searchNorm } from '@/lib/admin/slug';
import { useAdmin } from './AdminStore';
import PriceInput from './PriceInput';
import { input, inputBase } from './ui';

/**
 * All branches side by side: one row per product, one price column per branch. An empty cell means the
 * branch doesn't sell it; typing a price there adds it to that branch, clearing a price removes it.
 */
export default function CompareScreen() {
  const { data } = useAdmin();
  const branches = data.branches.branches;
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [onlyDiff, setOnlyDiff] = useState(false);

  const price = (b: string, id: string) => data.menus[b]?.items.find((e) => e.id === id)?.price;
  const rows = useMemo(() => {
    const nq = searchNorm(q.trim());
    const order = new Map(data.catalog.categories.map((c, n) => [c.id, n]));
    return data.catalog.items
      .filter((i) => (cat === 'all' || i.category === cat) && (!nq || searchNorm([i.name.az, i.group?.az, i.description].join(' ')).includes(nq)))
      .filter((i) => {
        if (!onlyDiff) return true;
        const ps = branches.map((b) => price(b.id, i.id));
        return new Set(ps.map((p) => p ?? 'none')).size > 1;
      })
      .sort((a, b) => order.get(a.category)! - order.get(b.category)!);
  }, [data, q, cat, onlyDiff, branches]);

  const catName = new Map(data.catalog.categories.map((c) => [c.id, c]));
  let last = '';

  return (
    <div>
      <h1 className="font-display text-3xl uppercase">Filialları müqayisə et</h1>
      <p className="mt-1 max-w-2xl text-sm text-mute">
        Hər məhsulun {branches.length} filialdakı qiyməti yan-yana. Boş xana = həmin filialda satılmır: qiymət yazsanız menyuya əlavə olunur, qiyməti silsəniz menyudan çıxarılır.
        Qiymət xanaları arasında Enter / ↑ ↓ ilə keçmək olar.
      </p>

      <div className="sticky top-[6.3rem] z-30 -mx-4 mt-4 flex flex-wrap gap-2 border-b border-white/5 bg-ink/95 px-4 py-3 backdrop-blur md:top-0 md:-mx-8 md:px-8">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Axtar…" aria-label="Axtar" className={`${input} min-w-0 flex-1 basis-48`} />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputBase} min-w-0 flex-1 basis-40 md:flex-none`} aria-label="Kateqoriya filtri">
          <option value="all">Bütün kateqoriyalar</option>
          {data.catalog.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name.az}
            </option>
          ))}
        </select>
        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="size-4 accent-[#f29a1f]" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} />
          Yalnız fərqli olanlar
        </label>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <table className="w-full min-w-[34rem] border-separate border-spacing-0 text-sm" data-testid="compare-table">
          <thead className="text-left text-xs uppercase tracking-wider text-mute">
            <tr>
              <th className="sticky left-0 z-10 bg-ink py-2 pr-3">Məhsul</th>
              {branches.map((b) => (
                <th key={b.id} className="py-2 text-right">
                  📍 {b.name.az}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={branches.length + 1} className="py-12 text-center text-mute">
                  Heç nə tapılmadı.
                </td>
              </tr>
            )}
            {rows.flatMap((i) => {
              const out = [];
              if (i.category !== last) {
                last = i.category;
                out.push(
                  // branch names repeat on every category row: the column headers scroll away on a long table
                  <tr key={`h-${i.category}`}>
                    <th className="sticky left-0 z-10 bg-ink pb-2 pt-6 text-left font-display text-lg uppercase tracking-wide text-cream">
                      {catName.get(i.category)?.icon} {catName.get(i.category)?.name.az}
                    </th>
                    {branches.map((b) => (
                      <th key={b.id} className="pb-2 pt-6 text-right text-xs font-semibold uppercase tracking-wider text-mute">
                        {b.name.az}
                      </th>
                    ))}
                  </tr>,
                );
              }
              const ps = branches.map((b) => price(b.id, i.id)).filter((p): p is number => p !== undefined);
              const differs = new Set(ps).size > 1;
              out.push(
                <tr key={i.id} data-testid={`cmp-${i.id}`} className="hover:bg-white/[.03]">
                  <td className="sticky left-0 z-10 border-b border-white/5 bg-ink py-2 pr-3">
                    <span className="font-semibold">{i.name.az}</span>
                    {i.group && <span className="text-xs text-mute"> · {i.group.az}</span>}
                    {differs && <span className="ml-2 rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-black uppercase text-gold">fərqli</span>}
                  </td>
                  {branches.map((b) => (
                    <td key={b.id} className="border-b border-white/5 py-2 pl-2 text-right">
                      <PriceInput branch={b.id} itemId={i.id} col="price" list={`cmp-${b.id}`} manageSold />
                    </td>
                  ))}
                </tr>,
              );
              return out;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
