import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Not a static export any more: /admin and /api/admin need a server. Public pages are still
  // prerendered at build time (see `dynamic = 'force-static'` on each of them).
  trailingSlash: true,
  // Photos are pre-optimised WebP in /public/img (the admin panel resizes uploads in the browser).
  images: { unoptimized: true },
  // Table QR codes printed before branches existed point at /menu/: those tables are in Günəşli.
  // permanent → 308, so the redirect is cached and search engines move the ranking over.
  async redirects() {
    return [{ source: '/menu', destination: '/gunesli/menu/', permanent: true }];
  },
};

export default nextConfig;
