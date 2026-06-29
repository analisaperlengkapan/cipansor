import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Compiler (experimental - only in development for safety)
  reactCompiler: process.env.NODE_ENV === "development",

  // Standalone output is for the Docker image (the Dockerfile sets
  // BUILD_STANDALONE=1 and runs `node server.js`). For everything else — local
  // dev, `next start`, and the e2e/CI server — leave it unset so `next start`
  // is fully supported (it is not, with output: "standalone").
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,

  // Production optimizations
  poweredByHeader: false,

  // Enable strict mode for better error catching
  reactStrictMode: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Compression
  compress: true,

  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Turbopack empty config to silence error when using webpack plugins (Sentry)
  turbopack: {},
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
});
