'use client';

import Link from 'next/link';
import Logo from './Logo';
import { useStore } from '@/lib/store';
import { config, telHref } from '@/lib/config';
import { branches } from '@/lib/branches';

/** On a branch page `qrSvg` is that branch's table QR code; the brand home page has none. */
export default function Footer({ qrSvg }: { qrSvg?: string }) {
  const { t, locale, branch } = useStore();
  const social = Object.entries(config.social).filter(([, url]) => url);
  const qrHref = qrSvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}` : '';
  const qrFile = `dana-burger-${branch?.id ?? 'menu'}-qr.svg`;
  return (
    <footer className={`border-t border-white/5 bg-black pt-12 md:pb-12 ${branch ? 'pb-28' : 'pb-12'}`}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1fr_auto]">
        <div>
          <Logo size={52} />
          <ul className="mt-5 grid gap-1.5 text-sm">
            {branches.map((b) => {
              const tel = telHref(b.phone);
              return (
                <li key={b.id} className="flex flex-wrap items-baseline gap-x-3">
                  <Link href={`/${b.id}/`} className={`font-bold hover:text-gold ${branch?.id === b.id ? 'text-gold' : ''}`}>
                    📍 {b.name[locale]}
                  </Link>
                  {tel && (
                    <a href={tel} className="text-mute hover:text-cream">
                      {b.phone.replace(/^\+994(\d{2})(\d{3})(\d{2})(\d{2})$/, '0$1 $2 $3 $4')}
                    </a>
                  )}
                  <span className="text-mute">{t.contact.hoursValue(b.hours.open, b.hours.close)}</span>
                </li>
              );
            })}
          </ul>
          {social.length > 0 && (
            <div className="mt-4 flex gap-3">
              {social.map(([name, url]) => (
                <a key={name} href={url} target="_blank" rel="noopener" className="capitalize text-mute hover:text-cream">
                  {name}
                </a>
              ))}
            </div>
          )}
          <p className="mt-8 text-sm text-mute">
            © {new Date().getFullYear()} {config.name}. {t.footer.rights}
          </p>
        </div>
        {qrSvg && branch && (
          <div className="flex items-center gap-4 self-start rounded-3xl border border-white/10 bg-card p-4">
            <a href={qrHref} download={qrFile} className="shrink-0 rounded-xl bg-white p-2" aria-label={`${t.footer.qrTitle}: ${branch.name[locale]}`}>
              <span className="block size-28" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </a>
            <div className="max-w-52">
              <p className="font-bold">{t.footer.qrTitle}</p>
              <p className="mt-1 text-sm text-mute">
                {branch.name[locale]} · {t.footer.qrText}
              </p>
              <a href={qrHref} download={qrFile} className="mt-2 inline-block text-sm font-bold text-gold">
                ⬇ SVG
              </a>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
