import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
  encode: vi.fn(),
}));

vi.mock('axios', () => ({
  default: { post: vi.fn() },
}));

const SECRET = 'test-secret';
const OLD_REFRESH = 'old-refresh-token';
const NEW_ACCESS = 'new-access-token';
const NEW_REFRESH = 'new-refresh-token';
const ENCODED_COOKIE = 'encoded-cookie-value';

async function load() {
  const { getToken, encode } = await import('next-auth/jwt');
  const axios = (await import('axios')).default;
  const { POST } = await import('../route');
  return {
    POST,
    getToken: getToken as Mock,
    encode: encode as Mock,
    axiosPost: axios.post as Mock,
  };
}

function makeRequest() {
  return new NextRequest('http://localhost:3000/api/auth/refresh', { method: 'POST' });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env.NEXTAUTH_SECRET = SECRET;
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  process.env.NEXT_PUBLIC_BACKEND_API = 'http://localhost:8000/';
});

describe('POST /api/auth/refresh', () => {
  it('returns 401 when there is no session cookie', async () => {
    const { POST, getToken } = await load();
    getToken.mockResolvedValue(null);

    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'No refresh token' });
  });

  it('returns 401 when session has no backendRefreshToken', async () => {
    const { POST, getToken } = await load();
    getToken.mockResolvedValue({ accessToken: 'some-access', backendRefreshToken: undefined });

    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'No refresh token' });
  });

  it('calls the backend with the refresh token from the encrypted cookie', async () => {
    const { POST, getToken, encode, axiosPost } = await load();
    getToken.mockResolvedValue({
      accessToken: 'old-access',
      backendRefreshToken: OLD_REFRESH,
      exp: 9999999999,
    });
    axiosPost.mockResolvedValue({ data: { access: NEW_ACCESS, refresh: NEW_REFRESH } });
    encode.mockResolvedValue(ENCODED_COOKIE);

    await POST(makeRequest());

    expect(axiosPost).toHaveBeenCalledWith('http://localhost:8000/api/v1/auth/token/refresh/', {
      refresh: OLD_REFRESH,
    });
  });

  it('never returns either token to the browser — both stay server-side', async () => {
    const { POST, getToken, encode, axiosPost } = await load();
    getToken.mockResolvedValue({
      accessToken: 'old-access',
      backendRefreshToken: OLD_REFRESH,
      exp: 9999999999,
    });
    axiosPost.mockResolvedValue({ data: { access: NEW_ACCESS, refresh: NEW_REFRESH } });
    encode.mockResolvedValue(ENCODED_COOKIE);

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ refreshed: true });
    expect(body).not.toHaveProperty('access');
    expect(body).not.toHaveProperty('refresh');
  });

  it('writes the rotated refresh token back into the httpOnly session cookie', async () => {
    const { POST, getToken, encode, axiosPost } = await load();
    const token = { accessToken: 'old-access', backendRefreshToken: OLD_REFRESH, exp: 9999999999 };
    getToken.mockResolvedValue(token);
    axiosPost.mockResolvedValue({ data: { access: NEW_ACCESS, refresh: NEW_REFRESH } });
    encode.mockResolvedValue(ENCODED_COOKIE);

    const res = await POST(makeRequest());

    // encode must have been called with the NEW refresh token so the cookie
    // carries the rotated value — reusing the old one would get blacklisted
    expect(encode).toHaveBeenCalledWith(
      expect.objectContaining({
        token: expect.objectContaining({
          accessToken: NEW_ACCESS,
          backendRefreshToken: NEW_REFRESH,
        }),
        secret: SECRET,
      })
    );

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('next-auth.session-token');
    expect(setCookie).toContain(ENCODED_COOKIE);
    expect(setCookie).toContain('HttpOnly');
  });

  it('chunks the cookie when the encoded session exceeds the browser size limit', async () => {
    const { POST, getToken, encode, axiosPost } = await load();
    getToken.mockResolvedValue({
      accessToken: 'old-access',
      backendRefreshToken: OLD_REFRESH,
      exp: 9999999999,
    });
    axiosPost.mockResolvedValue({ data: { access: NEW_ACCESS, refresh: NEW_REFRESH } });
    // Larger than a single cookie (CHUNK_SIZE 3800) → must be split across `.0`, `.1`.
    const bigCookie = 'x'.repeat(5000);
    encode.mockResolvedValue(bigCookie);

    const res = await POST(makeRequest());
    const setCookie = res.headers.get('set-cookie') ?? '';

    // Chunk cookies carry the value; the unchunked base cookie is cleared (Max-Age=0).
    expect(setCookie).toContain('next-auth.session-token.0=');
    expect(setCookie).toContain('next-auth.session-token.1=');
    // The unchunked base cookie is emptied so it can't shadow the chunks.
    expect(setCookie).toMatch(/next-auth\.session-token=;/);
  });

  it('preserves the original session expiry instead of sliding it on every refresh', async () => {
    const { POST, getToken, encode, axiosPost } = await load();
    const originalExp = Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60; // 3 days left
    getToken.mockResolvedValue({
      accessToken: 'old-access',
      backendRefreshToken: OLD_REFRESH,
      exp: originalExp,
    });
    axiosPost.mockResolvedValue({ data: { access: NEW_ACCESS, refresh: NEW_REFRESH } });
    encode.mockResolvedValue(ENCODED_COOKIE);

    await POST(makeRequest());

    const encodeCall = encode.mock.calls[0][0] as { maxAge: number };
    // maxAge should be approximately the remaining seconds (within a 5s tolerance)
    const expectedMaxAge = originalExp - Math.floor(Date.now() / 1000);
    expect(encodeCall.maxAge).toBeGreaterThan(expectedMaxAge - 5);
    expect(encodeCall.maxAge).toBeLessThanOrEqual(expectedMaxAge);
  });

  it('returns 401 when the backend rejects the refresh token (expired/blacklisted)', async () => {
    const { POST, getToken, axiosPost } = await load();
    getToken.mockResolvedValue({
      accessToken: 'old-access',
      backendRefreshToken: OLD_REFRESH,
      exp: 9999999999,
    });
    axiosPost.mockRejectedValue({
      response: { status: 401, data: { detail: 'Token is blacklisted' } },
    });

    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Refresh failed' });
  });
});
