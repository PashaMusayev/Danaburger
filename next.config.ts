import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Not a static export any more: /admin and /api/admin need a server. Public pages are still
  // prerendered at build time (see `dynamic = 'force-static'` on each of them).
  trailingSlash: true,
  // Photos are pre-optimised WebP in /public/img (the admin panel resizes uploads in the browser).
  images: { unoptimized: true },
};

export default nextConfig;
