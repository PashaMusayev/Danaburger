import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';
import { branchIds } from '@/lib/branches';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${config.siteUrl}/`, changeFrequency: 'weekly', priority: 1 },
    ...branchIds.flatMap((b) => [
      { url: `${config.siteUrl}/${b}/`, changeFrequency: 'weekly' as const, priority: 0.9 },
      { url: `${config.siteUrl}/${b}/menu/`, changeFrequency: 'weekly' as const, priority: 0.8 },
    ]),
  ];
}
