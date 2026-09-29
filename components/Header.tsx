'use client';

import Link from 'next/link';
import Logo from './Logo';
import { useStore } from '@/lib/store';
import type { Locale } from '@/lib/menu';
import { fmt } from '@/lib/menu';
import BranchSwitcher from './BranchSwitcher';

const LOCALES: Locale[] = ['az', 'ru', 'en'];

export default function Header() {
  const { t, locale, setLocale, count, total, setCartOpen, branch } = useStore();
  const base = branch ? `/${branch.id}/` : '/';
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link href="/">
            <Logo size={38} compact={!!branch} />
            {branch && <span className="sr-only sm:hidden">Dana Burger</span>}
          </Link>
          {branch && <BranchSwitcher />}
        </div>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-mute md:flex">
          {branch ? (
            <>
              <a href={`${base}#deals`} className="hover:text-cream">{t.nav.deals}</a>
              <a href={`${base}#menu`} className="hover:text-cream">{t.nav.menu}</a>
              <a href={`${base}#contact`} className="hover:text-cream">{t.nav.contact}</a>
            </>
          ) : (
            <a href="/#branches" className="hover:text-cream">{t.branches.title}</a>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-white/10 p-0.5 text-xs font-bold" role="group" aria-label="Language">
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                aria-pressed={locale === l}
                className={`rounded-full px-2.5 py-1.5 uppercase transition ${
                  locale === l ? 'bg-cream text-ink' : 'text-mute hover:text-cream'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          {branch && (
          <button
            data-testid="cart-button"
            onClick={() => setCartOpen(true)}
            className="hidden items-center gap-2 rounded-full bg-red px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600 md:flex"
          >
            🛒 {count > 0 ? `${count} · ${fmt(total)} ₼` : t.bar.cart}
          </button>
          )}
        </div>
      </div>
    </header>
  );
}
