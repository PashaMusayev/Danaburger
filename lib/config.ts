// Brand-wide settings. Per-branch contacts, address, coordinates and hours live in data/branches.json;
// social links, delivery apps and analytics IDs in data/settings.json. Edit both from /admin.
import settings from '@/data/settings.json';
import type { Geo } from './menu';

export type Settings = typeof settings;

export const config = {
  name: 'Dana Burger',
  city: 'Bakı',
  // The site's domain (QR codes, sitemap, SEO). Change after moving to a custom domain.
  siteUrl: 'https://danaburger-ten.vercel.app',
  timeZone: 'Asia/Baku',
  social: settings.social,
  delivery: settings.delivery,
  // Empty IDs → GA4 / Meta Pixel scripts aren't loaded.
  analytics: settings.analytics,
};

/** null when the branch has no phone yet: the call button is hidden. */
export const telHref = (phone: string) => (phone ? `tel:${phone}` : null);

/** Without a number wa.me lets the customer pick a contact, so the message still isn't lost. */
export const whatsappHref = (number: string, text?: string) => {
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${number.replace(/\D/g, '')}${q}`;
};

export const mapLinks = ({ lat, lng }: Geo) => ({
  google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
  yandex: `https://yandex.com/maps/?rtext=~${lat},${lng}&rtt=auto`,
  embed: `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`,
});

/** Straight-line distance in km (for "the nearest branch"). */
export function distanceKm(a: Geo, b: Geo): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
