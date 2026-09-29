import Image from 'next/image';
import type { MenuItem } from '@/lib/menu';
import { categories } from '@/lib/menu';

const icon = (cat: string) => categories.find((c) => c.id === cat)?.icon ?? '🍔';

/** Real photo when we have one, otherwise a branded placeholder so the grid never looks broken. */
export default function ProductImage({
  item,
  sizes,
  className = '',
  priority = false,
}: {
  item: MenuItem;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  if (item.image) {
    return (
      <div className={`relative overflow-hidden bg-card-2 ${className}`}>
        <Image
          src={item.image}
          alt={item.name.az}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background:
          'radial-gradient(120% 90% at 20% 10%, rgba(242,154,31,.28), transparent 55%), radial-gradient(100% 80% at 90% 100%, rgba(215,38,30,.35), transparent 60%), #171717',
      }}
      aria-hidden
    >
      <span className="text-4xl drop-shadow-[0_4px_12px_rgba(0,0,0,.6)] sm:text-5xl">{icon(item.category)}</span>
    </div>
  );
}
