/**
 * Derives the backend origin(s) this app is configured to talk to, from the
 * same env vars `next.config.ts` reads for `images.remotePatterns`.
 *
 * Shared by `next.config.ts` (Node build context) and `src/proxy.ts` (Edge
 * middleware) so CSP `connect-src`/`img-src` and the image-optimizer
 * allowlist can never drift apart — both derive from this one function
 * instead of each hardcoding a parallel list. Runtime-portable: only `URL`
 * and `process.env`, no Node-only APIs, since the Edge runtime can't use them.
 */

const BACKEND_ENV_VARS = ['NEXT_PUBLIC_BACKEND_API', 'NEXT_PUBLIC_BACKEND_RAW_API'];

export function backendUrls(): URL[] {
  const urls: URL[] = [];
  for (const name of BACKEND_ENV_VARS) {
    const raw = process.env[name];
    if (!raw) continue;
    try {
      const url = new URL(raw);
      // Skip schemeless values (e.g. a bare "localhost:8000"), which URL parses
      // with a bogus protocol — only real http(s) origins belong in CSP/images.
      if (url.protocol === 'http:' || url.protocol === 'https:') urls.push(url);
    } catch {
      // Ignore malformed/unset values.
    }
  }
  return urls;
}

/** Deduped backend origins (e.g. https://api.example.com) for CSP directives. */
export function backendOrigins(): string[] {
  return Array.from(new Set(backendUrls().map((u) => u.origin)));
}

/** Third-party image hosts (CDNs, avatar services), not the backend — these stay
 * hardcoded because they cannot be derived from an env var.
 *
 * Empty by default. Add a host here **and** to `images.remotePatterns` in
 * `next.config.ts`; listing it in only one place either blocks the request at
 * the CSP or makes next/image refuse to optimize it, and the two failures
 * look nothing alike. */
const THIRD_PARTY_IMG_HOSTS: string[] = [];

export function backendImgSrcHosts(): string[] {
  return [...backendOrigins(), ...THIRD_PARTY_IMG_HOSTS];
}

/** The same backend origins, with their scheme swapped for ws(s) — for the
 * realtime WebSocket (`useRealtimeSocket.ts`) connecting straight to the
 * backend rather than through the `/api/backend` proxy. Not every browser
 * treats an `http(s)` connect-src source as implicitly covering `ws(s)`, so
 * this is listed explicitly rather than relied upon. */
function backendWsOrigins(): string[] {
  return backendUrls().map((u) => `${u.protocol === 'https:' ? 'wss:' : 'ws:'}//${u.host}`);
}

export function backendConnectSrcHosts(): string[] {
  // Sentry's ingest host is `o<org-id>.ingest.sentry.io` -- a CSP wildcard can
  // only replace a whole label, so `o*.ingest.sentry.io` is invalid syntax
  // (the browser drops the entire source and logs a warning, never matching
  // any real ingest host). `*.ingest.sentry.io` is the valid form and still
  // covers the same `o<org-id>` subdomain.
  return ["'self'", 'https://*.ingest.sentry.io', ...backendOrigins(), ...backendWsOrigins()];
}
