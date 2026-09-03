import { describe, it, expect } from 'vitest';

import { backendConnectSrcHosts } from '../backendOrigins';

describe('backendConnectSrcHosts', () => {
  it('includes a syntactically valid CSP source for the Sentry ingest host', () => {
    const hosts = backendConnectSrcHosts();
    const sentryEntry = hosts.find((h) => h.includes('ingest.sentry.io'));

    expect(sentryEntry).toBeDefined();
    // A CSP wildcard may only replace a whole label (`*.example.com`), never
    // part of one (`o*.example.com`) -- the latter is invalid syntax and the
    // browser silently drops the entire source, which is exactly the bug
    // this test guards against (Sentry's ingest host is `o<org-id>.ingest.sentry.io`).
    expect(sentryEntry).toBe('https://*.ingest.sentry.io');
  });

  it('always includes self', () => {
    expect(backendConnectSrcHosts()).toContain("'self'");
  });
});
