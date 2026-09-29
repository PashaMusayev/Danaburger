import type { Settings } from '../config';
import type { BranchInfo } from '../menu';

export type SettingsErrors = Partial<Record<string, string>>;

const PHONE = /^\+994\d{9}$/;
const URL_RE = /^https:\/\/[^\s]+$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Accepts "050 123 45 67", "+994 50 123 45 67", "0501234567" → "+994501234567"; returns input unchanged if unsure. */
export function normalizePhone(s: string): string {
  const d = s.replace(/[^\d+]/g, '');
  if (!d) return '';
  if (/^0\d{9}$/.test(d)) return `+994${d.slice(1)}`;
  if (/^994\d{9}$/.test(d)) return `+${d}`;
  return d;
}

/** Brand-wide settings: social links, delivery apps, analytics. */
export function validateSettings(s: Settings): SettingsErrors {
  const e: SettingsErrors = {};
  for (const k of ['instagram', 'tiktok', 'facebook'] as const) if (s.social[k] && !URL_RE.test(s.social[k])) e[k] = 'Link https:// ilə başlamalıdır';
  for (const k of ['wolt', 'bolt'] as const) if (s.delivery[k] && !URL_RE.test(s.delivery[k])) e[k] = 'Link https:// ilə başlamalıdır';
  if (s.analytics.ga4Id && !/^G-[A-Z0-9]{4,}$/.test(s.analytics.ga4Id)) e.ga4Id = 'Format: G-XXXXXXXXXX';
  if (s.analytics.metaPixelId && !/^\d{6,20}$/.test(s.analytics.metaPixelId)) e.metaPixelId = 'Yalnız rəqəmlər';
  return e;
}

/** One branch's contacts, address, coordinates and hours. */
export function validateBranchInfo(b: BranchInfo): SettingsErrors {
  const e: SettingsErrors = {};
  const str = (v: unknown) => typeof v === 'string' && v.length < 300;
  if (!b || typeof b.id !== 'string' || !/^[a-z0-9-]+$/.test(b.id)) return { id: 'Filial id-si düzgün deyil' };
  if (!b.name || !str(b.name.az) || !b.name.az.trim()) e.name = 'Filialın adı boş ola bilməz';
  if (!b.address || !str(b.address.az)) e.address = 'Ünvan düzgün deyil';
  if (!str(b.phone) || (b.phone && !PHONE.test(b.phone))) e.phone = 'Format: +994XXXXXXXXX (məs. +994501234567)';
  if (!str(b.whatsapp) || (b.whatsapp && !PHONE.test(b.whatsapp))) e.whatsapp = 'Format: +994XXXXXXXXX (məs. +994501234567)';
  if (b.geo !== null) {
    const ok = b.geo && Number.isFinite(b.geo.lat) && Number.isFinite(b.geo.lng) && Math.abs(b.geo.lat) <= 90 && Math.abs(b.geo.lng) <= 180;
    if (!ok) e.geo = 'Koordinat düzgün deyil (məs. 40.374861, 49.977472)';
  }
  if (!b.hours || !TIME.test(b.hours.open) || !TIME.test(b.hours.close)) e.hours = 'Saat formatı: 11:00';
  return e;
}

/** "40.374861, 49.977472" or a Google Maps link → coordinates; null when it can't be read. */
export function parseGeo(s: string): { lat: number; lng: number } | null {
  const m = s.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

/** Server-side shape check so a bad payload can't break the site build. */
export function isSettingsShape(x: unknown): x is Settings {
  const s = x as Settings;
  const str = (v: unknown) => typeof v === 'string' && v.length < 300;
  return (
    !!s &&
    !!s.social && str(s.social.instagram) && str(s.social.tiktok) && str(s.social.facebook) &&
    !!s.delivery && str(s.delivery.wolt) && str(s.delivery.bolt) &&
    !!s.analytics && str(s.analytics.ga4Id) && str(s.analytics.metaPixelId)
  );
}
