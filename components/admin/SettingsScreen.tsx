'use client';

import type { Settings } from '@/lib/config';
import { normalizePhone, validateSettings } from '@/lib/admin/settings';
import { useAdmin } from './AdminStore';
import { Field, btn, input } from './ui';

export default function SettingsScreen() {
  const { settings, setSettings } = useAdmin();
  const errors = validateSettings(settings);
  const set = (fn: (s: Settings) => Settings) => setSettings(fn(structuredClone(settings)));
  const text = (id: string, label: string, value: string, onChange: (v: string) => void, opts: { hint?: string; placeholder?: string; phone?: boolean } = {}) => (
    <Field label={label} hint={opts.hint} error={errors[id]} htmlFor={`s-${id}`}>
      <input
        id={`s-${id}`}
        className={input}
        value={value}
        aria-invalid={!!errors[id]}
        inputMode={opts.phone ? 'tel' : undefined}
        placeholder={opts.placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={opts.phone ? (e) => onChange(normalizePhone(e.target.value)) : undefined}
      />
    </Field>
  );

  const wa = settings.whatsapp.replace(/\D/g, '');
  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <div>
        <h1 className="font-display text-3xl uppercase">Ayarlar</h1>
        <p className="mt-1 text-sm text-mute">Dəyişikliklər menyu dəyişiklikləri kimi aşağıdakı &quot;Sayta yayımla&quot; düyməsi ilə yayımlanır.</p>
      </div>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-card p-5">
        <h2 className="text-lg font-bold">Əlaqə</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {text('phone', 'Telefon', settings.phone, (v) => set((s) => ({ ...s, phone: v })), { phone: true, placeholder: '+994501234567', hint: 'Saytdakı "Zəng" düyməsi. Boş = düymə gizlidir' })}
          {text('whatsapp', 'WhatsApp nömrəsi', settings.whatsapp, (v) => set((s) => ({ ...s, whatsapp: v })), { phone: true, placeholder: '+994501234567', hint: 'Sifarişlər bu nömrəyə gəlir' })}
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={settings.phone && !errors.phone ? `tel:${settings.phone}` : undefined} aria-disabled={!settings.phone || !!errors.phone} className={`${btn.ghost} aria-disabled:pointer-events-none aria-disabled:opacity-40`}>
            📞 Zəngi test et
          </a>
          <a
            href={wa && !errors.whatsapp ? `https://wa.me/${wa}?text=${encodeURIComponent('Test: Dana Burger saytından')}` : undefined}
            target="_blank"
            rel="noopener"
            aria-disabled={!wa || !!errors.whatsapp}
            className={`${btn.ghost} aria-disabled:pointer-events-none aria-disabled:opacity-40`}
          >
            💬 WhatsApp-ı test et
          </a>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-card p-5">
        <h2 className="text-lg font-bold">Sosial şəbəkələr</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(['instagram', 'tiktok', 'facebook'] as const).map((k) =>
            text(k, k[0].toUpperCase() + k.slice(1), settings.social[k], (v) => set((s) => ({ ...s, social: { ...s.social, [k]: v.trim() } })), { placeholder: `https://${k}.com/...` }),
          )}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-card p-5">
        <h2 className="text-lg font-bold">Çatdırılma</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {text('wolt', 'Wolt səhifəsi', settings.delivery.wolt, (v) => set((s) => ({ ...s, delivery: { ...s.delivery, wolt: v.trim() } })), { placeholder: 'https://wolt.com/...' })}
          {text('bolt', 'Bolt Food səhifəsi', settings.delivery.bolt, (v) => set((s) => ({ ...s, delivery: { ...s.delivery, bolt: v.trim() } })), { placeholder: 'https://food.bolt.eu/...' })}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-card p-5">
        <h2 className="text-lg font-bold">Analitika</h2>
        <p className="-mt-2 text-sm text-mute">Saytdan gələn zəng, WhatsApp sifarişi və &quot;Yol tarifi&quot; kliklərini saymaq üçün.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {text('ga4Id', 'Google Analytics 4 ID', settings.analytics.ga4Id, (v) => set((s) => ({ ...s, analytics: { ...s.analytics, ga4Id: v.trim() } })), { placeholder: 'G-XXXXXXXXXX' })}
          {text('metaPixelId', 'Meta Pixel ID', settings.analytics.metaPixelId, (v) => set((s) => ({ ...s, analytics: { ...s.analytics, metaPixelId: v.trim() } })), { placeholder: '1234567890' })}
        </div>
      </section>
    </div>
  );
}
