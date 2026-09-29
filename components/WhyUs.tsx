'use client';

import SectionTitle from './SectionTitle';
import { useStore } from '@/lib/store';

export default function WhyUs() {
  const { t } = useStore();
  return (
    <section className="py-16" aria-labelledby="why-title">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle title={t.why.title} id="why-title" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {t.why.items.map((w) => (
            <div key={w.t} className="rounded-2xl border border-white/5 bg-card p-5">
              <div className="text-4xl" aria-hidden>
                {w.icon}
              </div>
              <h3 className="mt-3 font-bold leading-snug">{w.t}</h3>
              <p className="mt-1 text-sm text-mute">{w.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
