'use client';

import Image from 'next/image';
import OpenBadge from './OpenBadge';
import { useStore } from '@/lib/store';
import { whatsappHref } from '@/lib/config';
import { track } from '@/lib/analytics';

export default function Hero() {
  const { t } = useStore();
  return (
    <section className="relative isolate overflow-hidden">
      {/* warm glow behind the food, echoing the logo colours */}
      <div className="absolute -right-40 top-10 -z-10 size-[36rem] rounded-full bg-red/25 blur-[120px]" />
      <div className="absolute -left-40 bottom-0 -z-10 size-[28rem] rounded-full bg-gold/15 blur-[120px]" />

      <div className="mx-auto grid max-w-6xl items-center gap-6 pb-12 md:grid-cols-[1.05fr_1fr] md:gap-10 md:px-4 md:py-20">
        {/* Photo first on mobile. Shown near its native size: the source photos are small, stretching them full-screen blurs them. */}
        <div className="relative md:order-2">
          <div className="relative aspect-[16/11] w-full overflow-hidden md:rounded-[2rem] md:border md:border-white/10 md:shadow-[0_30px_80px_-20px_rgba(215,38,30,.45)]">
            <Image
              src="/img/hero.webp"
              alt="Dana Burger burgerləri"
              fill
              priority
              fetchPriority="high"
              sizes="(max-width:768px) 100vw, 560px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent md:from-ink/40" />
          </div>
          <span className="absolute -bottom-3 right-4 rotate-[-4deg] rounded-2xl bg-gold px-4 py-2 font-script text-xl text-ink shadow-xl md:-left-6 md:bottom-8 md:right-auto">
            {t.hero.kicker.split('·')[1]?.trim()}
          </span>
        </div>

        <div className="px-4 md:order-1 md:px-0">
          <OpenBadge />
          <h1 className="mt-5 font-display text-[3.2rem] uppercase leading-[0.92] sm:text-7xl lg:text-[5.4rem]">
            <span className="block">{t.hero.title1}</span>
            <span className="block text-gold">{t.hero.title2}</span>
            <span className="block text-red">{t.hero.title3}</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-cream/80 sm:text-lg">{t.hero.sub}</p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="#menu"
              className="rounded-2xl bg-red px-7 py-4 text-center text-lg font-extrabold text-white shadow-[0_10px_30px_-10px_rgba(215,38,30,.8)] transition hover:bg-red-600 active:scale-[.98]"
            >
              {t.hero.ctaMenu} →
            </a>
            <a
              href={whatsappHref(t.cart.msgHello)}
              target="_blank"
              rel="noopener"
              onClick={() => track('whatsapp_click', { location: 'hero' })}
              className="rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-center text-lg font-bold backdrop-blur transition hover:bg-white/10 active:scale-[.98]"
            >
              💬 {t.hero.ctaWhatsapp}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
