// @ts-nocheck
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use static export for desktop builds (Tauri), otherwise default (SSR)
  output: process.env.APP_ENV === 'desktop' ? 'export' : undefined,
  typescript: {
    // React 19 + Next.js 16 type compatibility
    ignoreBuildErrors: true,
  },
  // Empty turbopack config to silence webpack conflict warning
  turbopack: {},
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "1337",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "1337",
        pathname: "/uploads/**",
      },
    ],
  },
};

import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: false,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^http:\/\/127\.0\.0\.1:1337\/api\/.*$/,
        handler: 'NetworkOnly',
        options: {
          backgroundSync: {
            name: 'api-queue',
            options: {
              maxRetentionTime: 24 * 60,
            },
          },
        },
      },
      {
        urlPattern: /^http:\/\/127\.0\.0\.1:1337\/uploads\/.*$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'strapi-images',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          },
        },
      },
    ],
  },
});

export default withPWA(nextConfig);
