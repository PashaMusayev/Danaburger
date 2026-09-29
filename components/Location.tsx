'use client';

import { useState } from 'react';
import SectionTitle from './SectionTitle';
import OpenBadge from './OpenBadge';
import { useStore } from '@/lib/store';
import { config, mapLinks, telHref, whatsappHref } from '@/lib/config';
import { track } from '@/lib/analytics';

export default function Location() {
  const { t, locale } = useStore();
  // The map iframe is heavy; load it only when asked so the page stays fast.
  const [showMap, setShowMap] = useState(false);
  const tel = telHref();
  const delivery = Object.entries(config.delivery).filter(([, url]) => url);

  return (
    <section id="contact" className="py-16" aria-labelledby="contact-title">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-2">
        <div>
          <SectionTitle title={t.contact.title} id="contact-title" />
          <OpenBadge />
          <dl className="mt-6 grid gap-5">
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-mute">{t.contact.hours}</dt>
              <dd className="mt-1 font-display text-3xl">{t.contact.hoursValue}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-mute">{t.contact.address}</dt>
              <dd className="mt-1 text-lg">{config.address[locale]}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-mute">{t.contact.phone}</dt>
              <dd className="mt-1 text-lg">
                {tel ? (
                  <a href={tel} onClick={() => track('call_click', { location: 'contact' })} className="font-bold text-gold">
                    {config.phone}
                  </a>
                ) : (
                  <span className="text-mute">{t.contact.phoneSoon}</span>
                )}
              </dd>
            </div>
          </dl>

          <p className="mt-8 text-xs font-bold uppercase tracking-widest text-mute">{t.contact.directions}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ['Google Maps', mapLinks.google],
                ['Waze', mapLinks.waze],
                ['Yandex', mapLinks.yandex],
              ] as const
            ).map(([name, href]) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener"
                onClick={() => track('directions_click', { app: name })}
                className="rounded-xl bg-cream px-4 py-3 font-bold text-ink transition hover:bg-white"
              >
                📍 {name}
              </a>
            ))}
            <a
              href={whatsappHref(t.cart.msgHello)}
              target="_blank"
              rel="noopener"
              onClick={() => track('whatsapp_click', { location: 'contact' })}
              className="rounded-xl bg-[#25D366] px-4 py-3 font-bold text-ink"
            >
              💬 WhatsApp
            </a>
          </div>

          {delivery.length > 0 && (
            <>
              <p className="mt-6 text-xs font-bold uppercase tracking-widest text-mute">{t.contact.delivery}</p>
              <div className="mt-2 flex gap-2">
                {delivery.map(([name, url]) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener"
                    onClick={() => track('delivery_click', { app: name })}
                    className="rounded-xl border border-white/15 px-4 py-3 font-bold capitalize"
                  >
                    🛵 {name}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative min-h-80 overflow-hidden rounded-3xl border border-white/10 bg-card">
          {showMap ? (
            <iframe
              src={mapLinks.embed}
              title="Dana Burger xəritədə"
              className="absolute inset-0 size-full grayscale-[.3] invert-[.9] hue-rotate-180"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <button
              onClick={() => setShowMap(true)}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_50%_45%,rgba(215,38,30,.25),transparent_60%)]"
            >
              <span className="text-6xl" aria-hidden>
                📍
              </span>
              <span className="rounded-full bg-cream px-5 py-2.5 font-bold text-ink">🗺 {t.contact.title}</span>
              <span className="text-xs text-mute">
                {config.geo.lat}, {config.geo.lng}
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
