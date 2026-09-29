import { config } from '@/lib/config';
import { branches, getBranch, getBranchMenu } from '@/lib/branches';
import type { BranchInfo } from '@/lib/menu';

const ORG_ID = `${config.siteUrl}/#organization`;

function restaurant(b: BranchInfo, withMenu: boolean) {
  const url = `${config.siteUrl}/${b.id}/`;
  const menu = withMenu ? getBranchMenu(b.id) : null;
  return {
    '@type': 'Restaurant',
    '@id': `${url}#restaurant`,
    name: `${config.name} ${b.name.az}`,
    url,
    image: `${config.siteUrl}/og-${b.id}.jpg`,
    servesCuisine: ['Burgers', 'Shawarma', 'Turkish', 'Grill', 'Pizza'],
    priceRange: '₼',
    currenciesAccepted: 'AZN',
    parentOrganization: { '@id': ORG_ID },
    ...(b.phone ? { telephone: b.phone } : {}),
    address: { '@type': 'PostalAddress', streetAddress: b.address.az, addressLocality: 'Baku', addressCountry: 'AZ' },
    ...(b.geo
      ? {
          geo: { '@type': 'GeoCoordinates', latitude: b.geo.lat, longitude: b.geo.lng },
          hasMap: `https://www.google.com/maps?q=${b.geo.lat},${b.geo.lng}`,
        }
      : {}),
    openingHours: `Mo-Su ${b.hours.open}-${b.hours.close}`,
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: b.hours.open,
      closes: b.hours.close,
    },
    hasMenu: menu
      ? {
          '@type': 'Menu',
          name: `${config.name} ${b.name.az} menyu`,
          url: `${url}menu/`,
          inLanguage: 'az',
          hasMenuSection: menu.categories
            .map((c) => ({
              '@type': 'MenuSection',
              name: c.name.az,
              hasMenuItem: menu.items
                .filter((i) => i.category === c.id)
                .map((i) => ({
                  '@type': 'MenuItem',
                  name: i.group ? `${i.name.az} (${i.group.az})` : i.name.az,
                  ...(i.description && { description: i.description }),
                  offers: { '@type': 'Offer', price: i.price.toFixed(2), priceCurrency: 'AZN' },
                })),
            }))
            .filter((s) => s.hasMenuItem.length),
        }
      : `${url}menu/`,
  };
}

const organization = () => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: config.name,
  url: `${config.siteUrl}/`,
  logo: `${config.siteUrl}/img/logo-icon.png`,
  sameAs: Object.values(config.social).filter(Boolean),
});

const Script = ({ data }: { data: unknown }) => <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;

/** Brand home page: the organization and every branch (menus linked, not inlined). */
export function OrganizationJsonLd() {
  return <Script data={{ '@context': 'https://schema.org', '@graph': [organization(), ...branches.map((b) => restaurant(b, false))] }} />;
}

/** Branch page: only this branch, with its full menu and prices. */
export function BranchJsonLd({ branch }: { branch: string }) {
  return <Script data={{ '@context': 'https://schema.org', ...restaurant(getBranch(branch), true) }} />;
}
