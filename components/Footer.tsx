'use client';

import Logo from './Logo';
import { useStore } from '@/lib/store';
import { config } from '@/lib/config';

export default function Footer({ qrSvg }: { qrSvg: string }) {
  const { t } = useStore();
  const social = Object.entries(config.social).filter(([, url]) => url);
  const qrHref = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`;
  return (
    <footer className="border-t border-white/5 bg-black pb-28 pt-12 md:pb-12">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1fr_auto]">
        <div>
          <Logo size={52} />
          <p className="mt-4 font-script text-2xl text-gold">{t.contact.hoursValue}</p>
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
        <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-card p-4">
          <a href={qrHref} download="dana-burger-menu-qr.svg" className="shrink-0 rounded-xl bg-white p-2" aria-label={t.footer.qrTitle}>
            <span className="block size-28" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          </a>
          <div className="max-w-52">
            <p className="font-bold">{t.footer.qrTitle}</p>
            <p className="mt-1 text-sm text-mute">{t.footer.qrText}</p>
            <a href={qrHref} download="dana-burger-menu-qr.svg" className="mt-2 inline-block text-sm font-bold text-gold">
              ⬇ SVG
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
