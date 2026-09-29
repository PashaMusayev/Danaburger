'use client';

import Image from 'next/image';
import SectionTitle from './SectionTitle';
import { useStore } from '@/lib/store';
import { config } from '@/lib/config';

const photos = [
  'burger-trio', 'dana-burger-set', 'satobrian', 'pide-1', 'big-bang-set', 'terevezli-lokum',
  'black-lunch', 'pizza-set', 'saurma-set', 'seher-2', 'kasap-kofte', 'mix-burger-set',
];

export default function Gallery() {
  const { t } = useStore();
  return (
    <section className="py-16" aria-labelledby="gallery-title">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle title={t.gallery.title} id="gallery-title" />
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 lg:grid-cols-4">
          {photos.map((p, i) => (
            <div
              key={p}
              className={`group relative overflow-hidden rounded-lg sm:rounded-2xl ${i === 0 ? 'col-span-2 row-span-2' : 'aspect-square'}`}
            >
              <Image
                src={`/img/${p}.webp`}
                alt=""
                fill
                sizes="(max-width:640px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
        {config.social.instagram && (
          <a
            href={config.social.instagram}
            target="_blank"
            rel="noopener"
            className="mt-6 inline-flex rounded-full border border-white/15 px-5 py-3 font-bold transition hover:bg-white/5"
          >
            📸 {t.gallery.follow}
          </a>
        )}
      </div>
    </section>
  );
}
