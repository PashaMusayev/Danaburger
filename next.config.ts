import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  // Static export has no image server; photos are pre-optimised WebP in /public/img.
  images: { unoptimized: true },
};

export default nextConfig;
