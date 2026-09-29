import type { MetadataRoute } from 'next';
import { config } from '@/lib/config';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${config.siteUrl}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${config.siteUrl}/menu/`, changeFrequency: 'weekly', priority: 0.9 },
  ];
}
