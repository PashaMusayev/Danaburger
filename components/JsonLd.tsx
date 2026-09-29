import { config } from '@/lib/config';
import { categories, items } from '@/lib/menu';

export default function JsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: config.name,
    url: config.siteUrl,
    image: `${config.siteUrl}/og.jpg`,
    logo: `${config.siteUrl}/img/logo-icon.png`,
    servesCuisine: ['Burgers', 'Shawarma', 'Turkish', 'Grill', 'Pizza'],
    priceRange: '₼',
    currenciesAccepted: 'AZN',
    ...(config.phone ? { telephone: config.phone } : {}),
    address: { '@type': 'PostalAddress', addressLocality: 'Baku', addressCountry: 'AZ' },
    geo: { '@type': 'GeoCoordinates', latitude: config.geo.lat, longitude: config.geo.lng },
    hasMap: `https://www.google.com/maps?q=${config.geo.lat},${config.geo.lng}`,
    openingHours: 'Mo-Su 11:00-05:00',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: config.hours.open,
      closes: config.hours.close,
    },
    sameAs: Object.values(config.social).filter(Boolean),
    hasMenu: {
      '@type': 'Menu',
      name: `${config.name} menyu`,
      inLanguage: 'az',
      hasMenuSection: categories.map((c) => ({
        '@type': 'MenuSection',
        name: c.name.az,
        hasMenuItem: items
          .filter((i) => i.category === c.id)
          .map((i) => ({
            '@type': 'MenuItem',
            name: i.group ? `${i.name.az} (${i.group.az})` : i.name.az,
            ...(i.description && { description: i.description }),
            offers: { '@type': 'Offer', price: i.price.toFixed(2), priceCurrency: 'AZN' },
          })),
      })),
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
