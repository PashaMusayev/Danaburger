'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AdminProvider, useAdmin } from './AdminStore';
import { Dialog, btn } from './ui';

const NAV = [
  { href: '/admin/', label: 'Menyu', icon: '🍔' },
  { href: '/admin/history/', label: 'Tarixçə', icon: '🕘' },
  { href: '/admin/settings/', label: 'Ayarlar', icon: '⚙️' },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminProvider>
      <Shell>{children}</Shell>
    </AdminProvider>
  );
}

async function logout() {
  await fetch('/api/admin/logout/', { method: 'POST' }).catch(() => null);
  window.location.href = '/admin/login/';
}

function Shell({ children }: { children: ReactNode }) {
  const { status, loadError, reload, saveNow } = useAdmin();
  const path = usePathname();

  // Ctrl/Cmd+S anywhere: save the draft (the item editor handles it itself while open)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !document.querySelector('[data-editor-open]')) {
        e.preventDefault();
        saveNow();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveNow]);

  return (
    <div className="min-h-svh bg-ink text-cream md:pl-60">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-white/10 bg-black/40 p-4 md:flex">
        <Brand />
        <nav className="mt-8 grid gap-1" aria-label="Admin">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={path === n.href ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 font-semibold transition ${path === n.href ? 'bg-white/10 text-cream' : 'text-mute hover:bg-white/5 hover:text-cream'}`}
            >
              <span aria-hidden>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto grid gap-2 text-sm">
          <a href="/" target="_blank" rel="noopener" className="rounded-xl px-3 py-2 text-mute hover:text-cream">
            ↗ Sayta bax
          </a>
          <button onClick={logout} className="rounded-xl px-3 py-2 text-left text-mute hover:text-cream">
            ⎋ Çıxış
          </button>
          <p className="px-3 pt-2 text-xs text-mute/70">
            Qısayollar: <kbd>/</kbd> axtar · <kbd>N</kbd> yeni · <kbd>Ctrl+S</kbd> saxla
          </p>
        </div>
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Brand small />
          <div className="flex items-center gap-1">
            <a href="/" target="_blank" rel="noopener" className={btn.icon} aria-label="Sayta bax">
              ↗
            </a>
            <button onClick={logout} className={btn.icon} aria-label="Çıxış">
              ⎋
            </button>
          </div>
        </div>
        <nav className="grid grid-cols-3 border-t border-white/5" aria-label="Admin">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={path === n.href ? 'page' : undefined}
              className={`flex min-h-11 items-center justify-center gap-1.5 text-sm font-semibold ${path === n.href ? 'border-b-2 border-gold text-cream' : 'text-mute'}`}
            >
              <span aria-hidden>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="px-4 pb-40 pt-5 md:px-8 md:pt-8">
        {status === 'loading' && <Loading />}
        {status === 'error' && (
          <div className="mx-auto max-w-md rounded-2xl border border-red/40 bg-red/10 p-6 text-center">
            <p className="text-lg font-bold">Menyunu yükləmək olmadı</p>
            <p className="mt-2 text-sm text-cream/80">{loadError}</p>
            <button onClick={() => reload()} className={`${btn.primary} mt-4`}>
              Yenidən cəhd et
            </button>
          </div>
        )}
        {status === 'ready' && children}
      </main>

      <PublishBar />
      <Toasts />
      <ConfirmHost />
      <ConflictDialog />
    </div>
  );
}

function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link href="/admin/" className="flex items-center gap-2">
      <img src="/img/logo.webp" alt="" width={small ? 30 : 36} height={small ? 30 : 36} className="rounded-lg" />
      <span className="leading-tight">
        <span className="block text-sm font-black">
          <span className="text-red">Dana</span> <span className="text-gold">Burger</span>
        </span>
        <span className="block text-xs text-mute">Admin panel</span>
      </span>
    </Link>
  );
}

function Loading() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="Yüklənir">
      <p className="text-mute">Menyu yüklənir…</p>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5" />
      ))}
    </div>
  );
}

function PublishBar() {
  const { changes, problems, publish, phase, discard, confirm } = useAdmin();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const busy = phase.kind === 'uploading' || phase.kind === 'committing';
  const showStatus = phase.kind !== 'idle' && !changes.length;
  const visible = changes.length > 0 || phase.kind !== 'idle';

  // Publish its height so the phone "+" button and toasts always sit above the bar, never under it.
  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (!el) return root.style.setProperty('--admin-bar-h', '0px');
    const ro = new ResizeObserver(() => root.style.setProperty('--admin-bar-h', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.setProperty('--admin-bar-h', '0px');
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div ref={ref} className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#121212]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:left-60">
      {open && changes.length > 0 && (
        <ul className="max-h-60 overflow-y-auto border-b border-white/10 px-4 py-3 text-sm md:px-8">
          {changes.map((c, i) => (
            <li key={i} className="py-1 text-cream/90">
              • {c}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 md:gap-3 md:px-8 md:py-3">
        {showStatus ? (
          <DeployStatus />
        ) : (
          <>
            <button onClick={() => setOpen((o) => !o)} className="min-h-11 text-left" aria-expanded={open}>
              <span className="font-bold text-gold">{changes.length} dəyişiklik</span>
              <span className="ml-2 hidden text-sm text-mute underline-offset-2 hover:underline sm:inline">{open ? 'gizlət' : 'bax'}</span>
              {problems.length > 0 && <span className="block text-sm text-[#ff7a70]">⚠ {problems[0]}</span>}
            </button>
            <div className="ml-auto flex gap-2">
              <button
                disabled={busy}
                onClick={async () => {
                  if (await confirm({ title: 'Dəyişikliklər ləğv edilsin?', body: 'Yayımlanmamış bütün dəyişikliklər silinəcək.', ok: 'Ləğv et', danger: true })) discard();
                }}
                className={btn.ghost}
              >
                Ləğv et
              </button>
              <button disabled={busy || problems.length > 0} onClick={publish} className={btn.primary} data-testid="publish">
                {phase.kind === 'uploading'
                  ? `Fotolar yüklənir ${phase.done + 1}/${phase.total}…`
                  : phase.kind === 'committing'
                    ? 'Yayımlanır…'
                    : (
                        <>
                          <span className="sm:hidden">Yayımla</span>
                          <span className="hidden sm:inline">Sayta yayımla</span>
                        </>
                      )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DeployStatus() {
  const { phase } = useAdmin();
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  if (phase.kind === 'deploying') {
    const s = Math.round((Date.now() - phase.since) / 1000);
    return (
      <p className="flex min-h-11 items-center gap-2" role="status">
        <span className="size-3 animate-pulse rounded-full bg-gold" /> Yayımlandı. Sayt yenilənir… ({s} san., adətən ~1 dəq.)
      </p>
    );
  }
  if (phase.kind === 'live')
    return (
      <p className="flex min-h-11 items-center gap-3" role="status">
        <span className="font-bold text-ok">Saytda canlıdır ✓</span>
        <a href="/" target="_blank" rel="noopener" className="text-sm text-gold underline">
          Sayta bax
        </a>
      </p>
    );
  if (phase.kind === 'slow')
    return (
      <p className="min-h-11 py-2 text-sm" role="status">
        Yayımlandı, amma sayt hələ yenilənməyib. Bir neçə dəqiqə sonra saytı yoxlayın. Uzun sürərsə, developerə xəbər verin.
      </p>
    );
  if (phase.kind === 'published')
    return (
      <p className="flex min-h-11 items-center font-bold text-ok" role="status">
        Yayımlandı ✓
      </p>
    );
  return null;
}

function Toasts() {
  const { toasts } = useAdmin();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--admin-bar-h,0px)+1rem)] z-[80] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto max-w-md rounded-2xl px-4 py-3 text-sm font-semibold shadow-2xl ${
            t.kind === 'error' ? 'bg-red text-white' : t.kind === 'info' ? 'bg-white/90 text-ink' : 'bg-ok text-ink'
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

// The confirm button gets focus when the dialog opens, so Enter confirms and Tab → İmtina → Enter cancels.
function ConfirmHost() {
  const { confirmReq } = useAdmin();
  if (!confirmReq) return null;
  return (
    <Dialog open onClose={() => confirmReq.resolve(false)} title={confirmReq.title}>
      <div className="mt-3 text-cream/85">{confirmReq.body}</div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={() => confirmReq.resolve(false)} className={btn.ghost}>
          İmtina
        </button>
        <button data-autofocus onClick={() => confirmReq.resolve(true)} className={confirmReq.danger ? btn.primary : btn.gold}>
          {confirmReq.ok}
        </button>
      </div>
    </Dialog>
  );
}

function ConflictDialog() {
  const { conflict, reload } = useAdmin();
  if (!conflict) return null;
  return (
    <Dialog open onClose={() => undefined} title="Menyu başqa yerdən dəyişdirilib" wide>
      <p className="mt-3 text-cream/85">
        Siz redaktə edərkən menyu başqa yerdən (məsələn, başqa cihazdan) yayımlanıb. Heç nəyin üzərinə yazılmaması üçün menyunu yeniləmək lazımdır.
      </p>
      {conflict.changes.length > 0 && (
        <>
          <p className="mt-4 text-sm font-semibold">Sizin yayımlanmamış dəyişiklikləriniz (yenilədikdən sonra təkrar edin):</p>
          <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl bg-black/30 p-3 text-sm">
            {conflict.changes.map((c, i) => (
              <li key={i}>• {c}</li>
            ))}
          </ul>
        </>
      )}
      <div className="mt-5 flex justify-end">
        <button data-autofocus onClick={() => reload(false)} className={btn.gold}>
          Menyunu yenilə
        </button>
      </div>
    </Dialog>
  );
}
