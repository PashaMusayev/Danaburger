'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import OpenBadge from './OpenBadge';
import { useStore, read, LAST_BRANCH_KEY } from '@/lib/store';
import { branches, branchById } from '@/lib/branches';
import { distanceKm, telHref } from '@/lib/config';
import { track } from '@/lib/analytics';

type Nearest = { state: 'idle' } | { state: 'locating' } | { state: 'error'; msg: string } | { state: 'done'; km: Record<string, number>; best: string };

const prettyPhone = (p: string) => p.replace(/^\+994(\d{2})(\d{3})(\d{2})(\d{2})$/, '0$1 $2 $3 $4');

/** Brand home page: the three branches, first thing after a short hero. */
export default function BranchPicker() {
  const { t, locale } = useStore();
  const [last, setLast] = useState<string | null>(null);
  const [near, setNear] = useState<Nearest>({ state: 'idle' });

  // Remember where they ordered last time, but never redirect: they may want another branch today.
  useEffect(() => {
    const id = read<string | null>(LAST_BRANCH_KEY, null);
    if (id && branchById.has(id)) setLast(id);
  }, []);

  // With fewer than two mapped branches "nearest" would always name the same one, so the button waits for coordinates.
  const withGeo = branches.filter((b) => b.geo);
  const canLocate = withGeo.length >= 2;
  const findNearest = () => {
    // Location is asked for only here, after a tap, never on page load.
    if (!('geolocation' in navigator)) return setNear({ state: 'error', msg: t.branches.geoDenied });
    setNear({ state: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const me = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const km = Object.fromEntries(withGeo.map((b) => [b.id, distanceKm(me, b.geo!)]));
        const best = Object.entries(km).sort((a, b) => a[1] - b[1])[0][0];
        track('nearest_branch', { branch: best });
        setNear({ state: 'done', km, best });
      },
      () => setNear({ state: 'error', msg: t.branches.geoDenied }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  const lastBranch = last ? branchById.get(last) : null;

  return (
    <section id="branches" className="scroll-mt-20 pb-12 pt-3 md:pt-4" aria-labelledby="branches-title">
      <div className="mx-auto max-w-6xl px-4">
        {lastBranch && (
          <Link
            href={`/${lastBranch.id}/#menu`}
            className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3 font-semibold transition hover:bg-gold/15"
            data-testid="last-branch"
          >
            <span>🕘 {t.branches.last(lastBranch.name[locale])}</span>
            <span className="shrink-0 text-gold">{t.branches.lastGo}</span>
          </Link>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="mb-3 md:mb-6">
            <p className="hidden font-script text-2xl text-gold md:block">{t.branches.kicker}</p>
            <h2 id="branches-title" className="font-display text-3xl uppercase leading-none sm:text-5xl">
              {t.branches.title}
            </h2>
            <div className="rule mt-3 w-40 md:mt-4" />
          </div>
          {canLocate && (
            <button
              onClick={findNearest}
              disabled={near.state === 'locating'}
              className="mb-3 rounded-full border border-white/15 px-4 py-2.5 md:mb-6 text-sm font-bold transition hover:bg-white/5 disabled:opacity-60"
            >
              {near.state === 'locating' ? t.branches.locating : t.branches.nearest}
            </button>
          )}
        </div>
        <p className="-mt-3 mb-5 hidden max-w-xl text-mute sm:block">{t.branches.sub}</p>
        {near.state === 'error' && (
          <p role="status" className="mb-4 rounded-xl bg-white/5 px-4 py-3 text-sm text-cream/85">
            {near.msg}
          </p>
        )}

        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          {branches.map((b) => {
            const tel = telHref(b.phone);
            const km = near.state === 'done' ? near.km[b.id] : undefined;
            const best = near.state === 'done' && near.best === b.id;
            return (
              <article
                key={b.id}
                data-testid={`branch-${b.id}`}
                className={`relative flex flex-col rounded-3xl border bg-card p-3.5 transition sm:p-5 ${best ? 'border-gold shadow-[0_0_0_1px_rgba(242,154,31,.6)]' : 'border-white/10'}`}
              >
                {best && km !== undefined && (
                  <span className="absolute -top-3 left-5 rounded-full bg-gold px-3 py-1 text-xs font-black text-ink">
                    {t.branches.nearestLabel(km.toFixed(1))}
                  </span>
                )}
                <h3 className="font-display text-2xl uppercase leading-none sm:text-3xl">
                  <span aria-hidden>📍 </span>
                  {b.name[locale]}
                </h3>
                <p className="mt-1.5 text-sm text-mute">
                  {b.address[locale] || b.address.az}
                  {tel && ` · ${prettyPhone(b.phone)}`}
                  {km !== undefined && !best && ` · ${km.toFixed(1)} km`}
                </p>
                <OpenBadge hours={b.hours} className="mt-2.5 self-start sm:mt-3" />
                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 sm:mt-4">
                  <Link
                    href={`/${b.id}/`}
                    onClick={() => track('branch_select', { branch: b.id })}
                    className="rounded-2xl bg-red px-4 py-2.5 text-center sm:py-3 font-extrabold text-white transition hover:bg-red-600 active:scale-[.98]"
                  >
                    {t.branches.menu} →
                  </Link>
                  {tel && (
                    <a
                      href={tel}
                      onClick={() => track('call_click', { location: 'branch_card', branch: b.id })}
                      className="grid place-items-center rounded-2xl border border-white/15 px-4 font-bold transition hover:bg-white/5"
                      aria-label={`${t.branches.call}: ${b.name[locale]} ${prettyPhone(b.phone)}`}
                      title={prettyPhone(b.phone)}
                    >
                      📞
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
