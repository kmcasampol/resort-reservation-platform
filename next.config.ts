import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Accommodation / amenity photos are seeded from Unsplash. `domains` is
    // deprecated in Next 16 — remotePatterns is the supported, pattern-based
    // allow-list (see node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
