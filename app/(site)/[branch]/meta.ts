import type { Metadata } from 'next';
import az from '@/lib/i18n/az';
import { getBranch } from '@/lib/branches';

export function branchMetadata(id: string, sub = ''): Metadata {
  const b = getBranch(id);
  const title = az.meta.branchTitle(b.name.az);
  const description = az.meta.branchDescription(b.name.az);
  const images = [{ url: `/og-${id}.jpg`, width: 1200, height: 630, alt: `Dana Burger ${b.name.az}` }];
  return {
    title: sub ? `${sub} — Dana Burger ${b.name.az}` : title,
    description,
    alternates: { canonical: `/${id}/${sub ? 'menu/' : ''}` },
    openGraph: { type: 'website', locale: 'az_AZ', siteName: 'Dana Burger', title, description, images },
    twitter: { card: 'summary_large_image', title, description, images: images.map((i) => i.url) },
  };
}
