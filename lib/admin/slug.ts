const AZ: Record<string, string> = { ə: 'e', ı: 'i', ş: 's', ç: 'c', ğ: 'g', ö: 'o', ü: 'u', İ: 'i' };

/** "Çizburger" → "cizburger", "Dana burger (2 nəfərlik)" → "dana-burger-2-neferlik". */
export function slugify(s: string): string {
  return s
    .replace(/[əışçğöüİ]/gi, (c) => AZ[c.toLowerCase()] ?? AZ[c] ?? c)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function uniqueId(name: string, taken: Set<string>): string {
  const base = slugify(name) || 'mehsul';
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** Search that treats "cizburger" and "Çizburger" as the same word. */
export const searchNorm = (s: string) => slugify(s).replace(/-/g, ' ');
