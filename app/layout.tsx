import type { Metadata, Viewport } from 'next';
import { Anton, Inter, Kaushan_Script, Lobster, Oswald } from 'next/font/google';
import './globals.css';
import az from '@/lib/i18n/az';
import { config } from '@/lib/config';

// Every font here was checked for full Azerbaijani coverage (ə Ə ş ç ğ ı İ ö ü).
// Bebas Neue and Yellowtail were rejected: they have no ə/Ə glyph.
// Anton and Kaushan have no Cyrillic, so Oswald/Lobster fill in for RU text only
// (cyrillic subset + unicode-range: they're downloaded only when Russian is on screen).
const anton = Anton({ weight: '400', subsets: ['latin', 'latin-ext'], variable: '--font-anton', display: 'swap' });
// Only Anton is preloaded (it draws the hero headline). The rest swap in once loaded so the hero photo isn't
// competing with ~200 KB of fonts on slow mobile networks.
const kaushan = Kaushan_Script({ weight: '400', subsets: ['latin', 'latin-ext'], variable: '--font-kaushan', display: 'swap', preload: false });
const oswald = Oswald({ weight: '700', subsets: ['cyrillic'], variable: '--font-oswald', display: 'swap', preload: false });
const lobster = Lobster({ weight: '400', subsets: ['cyrillic'], variable: '--font-lobster', display: 'swap', preload: false });
const inter = Inter({ subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-inter', display: 'swap', preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: az.meta.title,
  description: az.meta.description,
  keywords: [
    'Bakıda burger',
    'gecə açıq restoran Bakı',
    'şaurma çatdırılma',
    'Dana Burger',
    'Dana Burger Günəşli',
    'Dana Burger Nərimanov',
    'Dana Burger 4-cü mikrorayon',
    'izqara Bakı',
    'ailə seti',
    'бургер Баку',
    'burger Baku',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'az_AZ',
    siteName: config.name,
    title: az.meta.title,
    description: az.meta.description,
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: config.name }],
  },
  twitter: { card: 'summary_large_image', title: az.meta.title, description: az.meta.description, images: ['/og.jpg'] },
  icons: { icon: '/img/logo-icon.png', apple: '/img/logo-icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#0b0b0b',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" className={`${anton.variable} ${kaushan.variable} ${oswald.variable} ${lobster.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
