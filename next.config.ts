import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import bundleAnalyzer from '@next/bundle-analyzer';
import { backendUrls } from '@/lib/backendOrigins';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Backend hosts as next/image remotePatterns, so images served from whatever
// backend the env points at load without touching this file. Derived from the
// same NEXT_PUBLIC_BACKEND_API* env vars `src/lib/backendOrigins.ts` uses for
// CSP, so switching backends is a pure .env change everywhere at once.
const backendRemotePatterns = Array.from(
  new Map(
    backendUrls().map((u) => [
      `${u.protocol}//${u.host}`,
      {
        protocol: u.protocol.replace(':', '') as 'http' | 'https',
        hostname: u.hostname,
        ...(u.port ? { port: u.port } : {}),
      },
    ])
  ).values()
);

// Static, non-CSP headers only — single source of truth, also applied by
// src/proxy.ts's SECURITY_HEADERS for the routes it matches (kept as the same
// literal values; see the comment there). CSP itself is generated per-request
// in src/proxy.ts instead of here, because a per-request nonce is what lets
// script-src drop 'unsafe-inline'/'unsafe-eval' — headers() below can't vary
// per request, so a nonce-based CSP can't live in this static array.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      // Backend host(s) derived from the env vars above.
      ...backendRemotePatterns,
      // Third-party CDNs go here, kept in sync with `thirdPartyImgHosts` above.
    ],
  },
  // Emits a self-contained server bundle with only the files actually needed,
  // so the Docker runtime stage can copy that instead of the whole node_modules
  // tree. Without it the production image carries every dev dependency.
  output: 'standalone',
  // Next's default trailing-slash redirect (`/foo/` → `/foo`) would otherwise
  // fire on every single call through src/app/api/backend/[...path]/route.ts —
  // every backend endpoint the frontend calls is slash-terminated, and that
  // route itself already normalizes the trailing slash before forwarding to
  // Django, so the redirect only adds a wasted round trip (and, for POST/PUT/
  // PATCH, depends on the client correctly re-sending the body on a 308) on
  // every authenticated request in the app. In-app navigation already uses
  // canonical no-trailing-slash paths throughout, so disabling the redirect
  // costs nothing there — it only ever mattered for a stray trailing slash
  // typed into the address bar.
  skipTrailingSlashRedirect: true,
};

const sentryOptions = {
  // Suppresses Sentry CLI output during build
  silent: true,
  // Only upload source maps when DSN is configured
  disableServerWebpackPlugin: !process.env.NEXT_PUBLIC_SENTRY_DSN,
  disableClientWebpackPlugin: !process.env.NEXT_PUBLIC_SENTRY_DSN,
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), sentryOptions);
