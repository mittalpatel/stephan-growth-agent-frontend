import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

async function load() {
  const { getToken } = await import('next-auth/jwt');
  const { proxy } = await import('../proxy');
  return { proxy, getToken: getToken as Mock };
}

function makeRequest(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000${path}`, { headers });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env.NEXTAUTH_SECRET = 'test-secret';
});

describe('proxy — getToken() failure handling', () => {
  // Regression test for the fix in src/proxy.ts: a malformed/forged
  // Authorization header can make next-auth's getToken() throw. Before the
  // fix, that exception was unhandled and would crash the middleware — a DoS
  // against every route it gates, since proxy.ts runs on every matched
  // request. The fix wraps the call and treats any thrown error the same as
  // "no token" (unauthenticated), never letting it propagate.
  it('treats a thrown error from getToken() as unauthenticated rather than crashing', async () => {
    const { proxy, getToken } = await load();
    getToken.mockRejectedValue(new Error('malformed JWT'));

    const response = await proxy(makeRequest('/dashboard'));

    // Unauthenticated hitting a protected route redirects to /login — it must
    // not throw, and must not be treated as an authenticated request.
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
  });

  it('does not crash when getToken() throws on a public route', async () => {
    const { proxy, getToken } = await load();
    getToken.mockRejectedValue(new Error('malformed JWT'));

    const response = await proxy(makeRequest('/login'));

    expect(response.status).toBe(200);
  });

  it('proceeds normally when getToken() resolves', async () => {
    const { proxy, getToken } = await load();
    getToken.mockResolvedValue(null);

    const response = await proxy(makeRequest('/login'));

    expect(response.status).toBe(200);
  });
});

describe('proxy — CVE-2025-29927 mitigation', () => {
  it('rejects a spoofed x-middleware-subrequest header', async () => {
    const { proxy } = await load();

    const response = await proxy(makeRequest('/dashboard', { 'x-middleware-subrequest': '1' }));

    expect(response.status).toBe(403);
  });
});

describe('proxy — CSP nonce', () => {
  it('sets a Content-Security-Policy header whose nonce is unique per request', async () => {
    const { proxy, getToken } = await load();
    getToken.mockResolvedValue(null);

    const first = await proxy(makeRequest('/login'));
    const second = await proxy(makeRequest('/login'));

    const firstNonce = first.headers.get('content-security-policy')?.match(/nonce-([^']+)/)?.[1];
    const secondNonce = second.headers.get('content-security-policy')?.match(/nonce-([^']+)/)?.[1];

    expect(firstNonce).toBeTruthy();
    expect(secondNonce).toBeTruthy();
    expect(firstNonce).not.toBe(secondNonce);
  });
});
