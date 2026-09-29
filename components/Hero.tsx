'use client';

import Image from 'next/image';
import OpenBadge from './OpenBadge';
import { useStore } from '@/lib/store';
import { whatsappHref } from '@/lib/config';
import { track } from '@/lib/analytics';

/** Brand home page (compact, points to the branch picker) or a branch page (menu + that branch's WhatsApp). */
export default function Hero() {
  const { t, locale, branch } = useStore();
  const hoursText = branch ? `${branch.hours.open} – ${branch.hours.close}` : '';
  return (
    <section className="relative isolate overflow-hidden">
      {/* warm glow behind the food, echoing the logo colours */}
      <div className="absolute -right-40 top-10 -z-10 size-[36rem] rounded-full bg-red/25 blur-[120px]" />
      <div className="absolute -left-40 bottom-0 -z-10 size-[28rem] rounded-full bg-gold/15 blur-[120px]" />

      <div className={`mx-auto grid max-w-6xl items-center md:grid-cols-[1.05fr_1fr] md:px-4 ${branch ? 'gap-6 pb-12 md:gap-10 md:py-20' : 'gap-4 pb-2 pt-4 md:gap-8 md:py-8'}`}>
        {/* Photo first on mobile. Shown near its native size: the source photos are small, stretching them full-screen blurs them. */}
        {/* on the brand home page phones skip the photo so all three branch cards fit on the first screen */}
        <div className={`relative md:order-2 ${branch ? '' : 'hidden md:block'}`}>
          <div
            className={`relative w-full overflow-hidden md:rounded-[2rem] md:border md:border-white/10 md:shadow-[0_30px_80px_-20px_rgba(215,38,30,.45)] ${
              branch ? 'aspect-[16/11]' : 'aspect-[16/7] md:aspect-[16/10]'
            }`}
          >
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
            {branch ? `📍 ${branch.name[locale]}` : t.hero.brandKicker.split('·')[2]?.trim()}
          </span>
        </div>

        <div className="px-4 md:order-1 md:px-0">
          {branch ? (
            <OpenBadge />
          ) : (
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold">{t.hero.brandKicker}</p>
          )}
          <h1 className={`font-display uppercase leading-[0.92] ${branch ? 'mt-5 text-[3.2rem] sm:text-7xl lg:text-[5.4rem]' : 'mt-2 text-[2rem] sm:text-6xl lg:text-7xl'}`}>
            <span className="block">{t.hero.title1}</span>
            <span className="block text-gold">{t.hero.title2}</span>
            <span className="block text-red">{t.hero.title3}</span>
          </h1>
          <p className={`max-w-md text-cream/80 ${branch ? 'mt-5 text-base sm:text-lg' : 'mt-3 hidden text-base md:block'}`}>{t.hero.sub}</p>
          {branch && <p className="mt-2 text-sm text-mute">{t.hero.kicker(branch.name[locale], hoursText)}</p>}

          <div className={`mt-7 flex-col gap-3 sm:flex-row ${branch ? 'flex' : 'hidden md:flex'}`}>
            <a
              href={branch ? '#menu' : '#branches'}
              className="rounded-2xl bg-red px-7 py-4 text-center text-lg font-extrabold text-white shadow-[0_10px_30px_-10px_rgba(215,38,30,.8)] transition hover:bg-red-600 active:scale-[.98]"
            >
              {branch ? t.hero.ctaMenu : t.branches.title} →
            </a>
            {branch && (
              <a
                href={whatsappHref(branch.whatsapp, t.cart.msgHello(branch.name.az))}
                target="_blank"
                rel="noopener"
                onClick={() => track('whatsapp_click', { location: 'hero', branch: branch.id })}
                className="rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-center text-lg font-bold backdrop-blur transition hover:bg-white/10 active:scale-[.98]"
              >
                💬 {t.hero.ctaWhatsapp}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
