'use client';

import { useEffect, useState } from 'react';
import type { BranchInfo } from '@/lib/menu';
import type { Settings } from '@/lib/config';
import { normalizePhone, parseGeo, validateBranchInfo, validateSettings } from '@/lib/admin/settings';
import { branchMenuUrl, menuQrSvg } from '@/lib/qr';
import { useAdmin } from './AdminStore';
import { Field, btn, input } from './ui';

export default function SettingsScreen() {
  const { data, update } = useAdmin();
  const settings = data.settings;
  const errors = validateSettings(settings);
  const set = (fn: (s: Settings) => Settings) => update((d) => ({ ...d, settings: fn(structuredClone(d.settings)) }));
  const text = (id: string, label: string, value: string, onChange: (v: string) => void, placeholder?: string) => (
    <Field label={label} error={errors[id]} htmlFor={`s-${id}`}>
      <input id={`s-${id}`} className={input} value={value} aria-invalid={!!errors[id]} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <div>
        <h1 className="font-display text-3xl uppercase">Ayarlar</h1>
        <p className="mt-1 text-sm text-mute">Dəyişikliklər menyu dəyişiklikləri kimi aşağıdakı &quot;Sayta yayımla&quot; düyməsi ilə yayımlanır.</p>
      </div>

      {data.branches.branches.map((b) => (
        <BranchCard key={b.id} branch={b} />
      ))}

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-card p-5">
        <h2 className="text-lg font-bold">Sosial şəbəkələr (bütün filiallar)</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(['instagram', 'tiktok', 'facebook'] as const).map((k) =>
            text(k, k[0].toUpperCase() + k.slice(1), settings.social[k], (v) => set((s) => ({ ...s, social: { ...s.social, [k]: v.trim() } })), `https://${k}.com/...`),
          )}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-card p-5">
        <h2 className="text-lg font-bold">Çatdırılma</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {text('wolt', 'Wolt səhifəsi', settings.delivery.wolt, (v) => set((s) => ({ ...s, delivery: { ...s.delivery, wolt: v.trim() } })), 'https://wolt.com/...')}
          {text('bolt', 'Bolt Food səhifəsi', settings.delivery.bolt, (v) => set((s) => ({ ...s, delivery: { ...s.delivery, bolt: v.trim() } })), 'https://food.bolt.eu/...')}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-card p-5">
        <h2 className="text-lg font-bold">Analitika</h2>
        <p className="-mt-2 text-sm text-mute">Saytdan gələn zəng, WhatsApp sifarişi və &quot;Yol tarifi&quot; kliklərini saymaq üçün (filial-filial).</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {text('ga4Id', 'Google Analytics 4 ID', settings.analytics.ga4Id, (v) => set((s) => ({ ...s, analytics: { ...s.analytics, ga4Id: v.trim() } })), 'G-XXXXXXXXXX')}
          {text('metaPixelId', 'Meta Pixel ID', settings.analytics.metaPixelId, (v) => set((s) => ({ ...s, analytics: { ...s.analytics, metaPixelId: v.trim() } })), '1234567890')}
        </div>
      </section>
    </div>
  );
}

/** One branch: contacts, address, map coordinates, hours and its table QR code. */
function BranchCard({ branch: b }: { branch: BranchInfo }) {
  const { update } = useAdmin();
  const errors = validateBranchInfo(b);
  const set = (patch: Partial<BranchInfo>) =>
    update((d) => ({ ...d, branches: { branches: d.branches.branches.map((x) => (x.id === b.id ? { ...x, ...patch } : x)) } }));
  const [geoText, setGeoText] = useState(b.geo ? `${b.geo.lat}, ${b.geo.lng}` : '');
  const [geoBad, setGeoBad] = useState(false);
  const [qr, setQr] = useState('');
  useEffect(() => {
    menuQrSvg(b.id).then(setQr);
  }, [b.id]);
  const wa = b.whatsapp.replace(/\D/g, '');
  const id = (k: string) => `b-${b.id}-${k}`;

  return (
    <section className="grid gap-4 rounded-2xl border border-white/10 bg-card p-5" data-testid={`branch-settings-${b.id}`} aria-labelledby={id('h')}>
      <h2 id={id('h')} className="text-lg font-bold">
        📍 {b.name.az}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Telefon" hint="Saytdakı &quot;Zəng&quot; düyməsi. Boş = düymə gizlidir" error={errors.phone} htmlFor={id('phone')}>
          <input id={id('phone')} className={input} inputMode="tel" value={b.phone} aria-invalid={!!errors.phone} placeholder="+994501234567" onChange={(e) => set({ phone: e.target.value })} onBlur={(e) => set({ phone: normalizePhone(e.target.value) })} />
        </Field>
        <Field label="WhatsApp nömrəsi" hint="Bu filialın sifarişləri bu nömrəyə gəlir" error={errors.whatsapp} htmlFor={id('wa')}>
          <input id={id('wa')} className={input} inputMode="tel" value={b.whatsapp} aria-invalid={!!errors.whatsapp} placeholder="+994501234567" onChange={(e) => set({ whatsapp: e.target.value })} onBlur={(e) => set({ whatsapp: normalizePhone(e.target.value) })} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={b.phone && !errors.phone ? `tel:${b.phone}` : undefined} aria-disabled={!b.phone || !!errors.phone} className={`${btn.ghost} aria-disabled:pointer-events-none aria-disabled:opacity-40`}>
          📞 Zəngi test et
        </a>
        <a
          href={wa && !errors.whatsapp ? `https://wa.me/${wa}?text=${encodeURIComponent(`Test: Dana Burger ${b.name.az} saytından`)}` : undefined}
          target="_blank"
          rel="noopener"
          aria-disabled={!wa || !!errors.whatsapp}
          className={`${btn.ghost} aria-disabled:pointer-events-none aria-disabled:opacity-40`}
        >
          💬 WhatsApp-ı test et
        </a>
      </div>

      <Field label="Ünvan (AZ)" error={errors.address} htmlFor={id('addr')}>
        <input id={id('addr')} className={input} value={b.address.az} onChange={(e) => set({ address: { ...b.address, az: e.target.value } })} placeholder="məs. Nərimanov r., Təbriz küç. 12" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ünvan (RU)" hint="Boş qalsa, AZ ünvan göstərilir" htmlFor={id('addr-ru')}>
          <input id={id('addr-ru')} className={input} value={b.address.ru ?? ''} onChange={(e) => set({ address: { ...b.address, ru: e.target.value } })} />
        </Field>
        <Field label="Ünvan (EN)" hint="Boş qalsa, AZ ünvan göstərilir" htmlFor={id('addr-en')}>
          <input id={id('addr-en')} className={input} value={b.address.en ?? ''} onChange={(e) => set({ address: { ...b.address, en: e.target.value } })} />
        </Field>
      </div>

      <Field
        label="Xəritə koordinatı"
        hint="Google Maps-da filialın üstünə sağ klik → rəqəmlərə klik edib kopyalayın, bura yapışdırın. Boş = xəritə və &quot;Yol tarifi&quot; gizlidir"
        error={geoBad ? 'Koordinatı oxumaq olmadı. Nümunə: 40.374861, 49.977472' : errors.geo}
        htmlFor={id('geo')}
      >
        <input
          id={id('geo')}
          className={input}
          value={geoText}
          aria-invalid={geoBad}
          placeholder="40.374861, 49.977472"
          onChange={(e) => setGeoText(e.target.value)}
          onBlur={() => {
            if (!geoText.trim()) {
              setGeoBad(false);
              return set({ geo: null });
            }
            const g = parseGeo(geoText);
            setGeoBad(!g);
            if (g) {
              setGeoText(`${g.lat}, ${g.lng}`);
              set({ geo: g });
            }
          }}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Açılır" error={errors.hours} htmlFor={id('open')}>
          <input id={id('open')} type="time" className={input} value={b.hours.open} onChange={(e) => set({ hours: { ...b.hours, open: e.target.value } })} />
        </Field>
        <Field label="Bağlanır" hint="Gecə yarısından sonra da ola bilər (məs. 05:00)" htmlFor={id('close')}>
          <input id={id('close')} type="time" className={input} value={b.hours.close} onChange={(e) => set({ hours: { ...b.hours, close: e.target.value } })} />
        </Field>
      </div>

      {qr && (
        <div className="flex items-center gap-4 rounded-xl bg-black/30 p-3">
          <span className="block size-24 shrink-0 rounded-lg bg-white p-1.5" dangerouslySetInnerHTML={{ __html: qr }} />
          <div className="text-sm">
            <p className="font-bold">Masalar üçün QR kod</p>
            <p className="mt-0.5 break-all text-mute">{branchMenuUrl(b.id)}</p>
            <a href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`} download={`dana-burger-${b.id}-qr.svg`} className="mt-1.5 inline-block font-bold text-gold">
              ⬇ Çap üçün yüklə (SVG)
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
