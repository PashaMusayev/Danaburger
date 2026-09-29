import type { Settings } from '../config';

export type SettingsErrors = Partial<Record<string, string>>;

const PHONE = /^\+994\d{9}$/;
const URL_RE = /^https:\/\/[^\s]+$/;

/** Accepts "050 123 45 67", "+994 50 123 45 67", "0501234567" → "+994501234567"; returns input unchanged if unsure. */
export function normalizePhone(s: string): string {
  const d = s.replace(/[^\d+]/g, '');
  if (!d) return '';
  if (/^0\d{9}$/.test(d)) return `+994${d.slice(1)}`;
  if (/^994\d{9}$/.test(d)) return `+${d}`;
  return d;
}

export function validateSettings(s: Settings): SettingsErrors {
  const e: SettingsErrors = {};
  if (s.phone && !PHONE.test(s.phone)) e.phone = 'Format: +994XXXXXXXXX (məs. +994501234567)';
  if (s.whatsapp && !PHONE.test(s.whatsapp)) e.whatsapp = 'Format: +994XXXXXXXXX (məs. +994501234567)';
  for (const k of ['instagram', 'tiktok', 'facebook'] as const) if (s.social[k] && !URL_RE.test(s.social[k])) e[k] = 'Link https:// ilə başlamalıdır';
  for (const k of ['wolt', 'bolt'] as const) if (s.delivery[k] && !URL_RE.test(s.delivery[k])) e[k] = 'Link https:// ilə başlamalıdır';
  if (s.analytics.ga4Id && !/^G-[A-Z0-9]{4,}$/.test(s.analytics.ga4Id)) e.ga4Id = 'Format: G-XXXXXXXXXX';
  if (s.analytics.metaPixelId && !/^\d{6,20}$/.test(s.analytics.metaPixelId)) e.metaPixelId = 'Yalnız rəqəmlər';
  return e;
}

/** Server-side shape check so a bad payload can't break the site build. */
export function isSettingsShape(x: unknown): x is Settings {
  const s = x as Settings;
  const str = (v: unknown) => typeof v === 'string' && v.length < 300;
  return (
    !!s && str(s.phone) && str(s.whatsapp) &&
    !!s.social && str(s.social.instagram) && str(s.social.tiktok) && str(s.social.facebook) &&
    !!s.delivery && str(s.delivery.wolt) && str(s.delivery.bolt) &&
    !!s.analytics && str(s.analytics.ga4Id) && str(s.analytics.metaPixelId)
  );
}
