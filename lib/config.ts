// Restoranın biznes məlumatları.
// Telefon, WhatsApp, sosial linklər və analitika ID-ləri `data/settings.json`-dadır:
// onları admin paneldən (/admin → Ayarlar) dəyişin.
import settings from '@/data/settings.json';

export type Settings = typeof settings;

export const config = {
  name: 'Dana Burger',
  city: 'Bakı',

  // Saytın son domeni (QR kod, sitemap və SEO üçün). Deploy-dan sonra dəyişin.
  siteUrl: 'https://danaburger-ten.vercel.app',

  // '+994XXXXXXXXX'. Boş olanda "Zəng" düyməsi gizlənir və WhatsApp müştəriyə kontakt seçdirir.
  phone: settings.phone,
  whatsapp: settings.whatsapp,

  geo: { lat: 40.374861, lng: 49.977472 },
  address: {
    az: 'Bakı, Azərbaycan',
    ru: 'Баку, Азербайджан',
    en: 'Baku, Azerbaijan',
  },

  // Gecə yarısını keçən iş saatları: 11:00 → ertəsi gün 05:00
  hours: { open: '11:00', close: '05:00', timeZone: 'Asia/Baku' },

  social: settings.social,
  delivery: settings.delivery,
  // Boş olanda GA4 / Meta Pixel skriptləri yüklənmir.
  analytics: settings.analytics,
};

export const telHref = () => (config.phone ? `tel:${config.phone}` : null);

export const whatsappHref = (text?: string) => {
  const num = config.whatsapp.replace(/\D/g, '');
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${num}${q}`;
};

const { lat, lng } = config.geo;
export const mapLinks = {
  google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
  yandex: `https://yandex.com/maps/?rtext=~${lat},${lng}&rtt=auto`,
  embed: `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`,
};
