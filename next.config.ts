import type { NextConfig } from "next";

// Content-Security-Policy directives
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://cdn.shopify.com https://flagcdn.com https://www.google-analytics.com https://www.facebook.com data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://hoodd-shop-2.myshopify.com https://www.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com",
  "frame-src https://www.facebook.com",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://hoodd-shop-2.myshopify.com",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/vehicles/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
