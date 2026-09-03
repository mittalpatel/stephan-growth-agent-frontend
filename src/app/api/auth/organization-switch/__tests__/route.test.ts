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
const ACCESS = 'current-access-token';
const NEW_ACCESS = 'new-access-token';
const NEW_REFRESH = 'new-refresh-token';
const ORG_ID = '0c2f6a1e-1111-4a2b-8c3d-4e5f60718293';

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

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/auth/organization-switch', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env.NEXTAUTH_SECRET = SECRET;
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  process.env.NEXT_PUBLIC_BACKEND_API = 'http://localhost:8000/';
});

describe('POST /api/auth/organization-switch', () => {
  it('returns 401 without a session', async () => {
    const { POST, getToken } = await load();
    getToken.mockResolvedValue(null);

    const response = await POST(makeRequest({ organizationId: ORG_ID }));

    expect(response.status).toBe(401);
  });

  it('rejects a non-UUID organization id without calling the backend', async () => {
    // The id is interpolated into a URL path, so it must never be attacker-shaped.
    const { POST, getToken, axiosPost } = await load();
    getToken.mockResolvedValue({ accessToken: ACCESS });

    for (const bad of ['../../admin', 'not-a-uuid', '', '1 OR 1=1']) {
      const response = await POST(makeRequest({ organizationId: bad }));
      expect(response.status).toBe(400);
    }
    expect(axiosPost).not.toHaveBeenCalled();
  });

  // The reason this route exists at all.
  it('never returns either token in the response body', async () => {
    const { POST, getToken, encode, axiosPost } = await load();
    getToken.mockResolvedValue({ accessToken: ACCESS, exp: 9_999_999_999 });
    encode.mockResolvedValue('encoded-cookie');
    axiosPost.mockResolvedValue({
      data: { data: { access: NEW_ACCESS, refresh: NEW_REFRESH, user: { id: 'u1' } } },
    });

    const response = await POST(makeRequest({ organizationId: ORG_ID }));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).not.toContain(NEW_REFRESH);
    expect(body).not.toContain(NEW_ACCESS);
    expect(JSON.parse(body)).toEqual({ user: { id: 'u1' } });
  });

  it('writes the rotated pair into the session cookie instead', async () => {
    const { POST, getToken, encode, axiosPost } = await load();
    getToken.mockResolvedValue({ accessToken: ACCESS, exp: 9_999_999_999 });
    encode.mockResolvedValue('encoded-cookie');
    axiosPost.mockResolvedValue({
      data: { data: { access: NEW_ACCESS, refresh: NEW_REFRESH, user: { id: 'u1' } } },
    });

    const response = await POST(makeRequest({ organizationId: ORG_ID }));

    const encoded = encode.mock.calls[0][0];
    expect(encoded.token.accessToken).toBe(NEW_ACCESS);
    expect(encoded.token.backendRefreshToken).toBe(NEW_REFRESH);
    expect(response.cookies.get('next-auth.session-token')?.httpOnly).toBe(true);
  });

  it('sends the caller its own access token, never one from the request', async () => {
    const { POST, getToken, encode, axiosPost } = await load();
    getToken.mockResolvedValue({ accessToken: ACCESS, exp: 9_999_999_999 });
    encode.mockResolvedValue('encoded-cookie');
    axiosPost.mockResolvedValue({ data: { data: { access: NEW_ACCESS, refresh: NEW_REFRESH } } });

    await POST(makeRequest({ organizationId: ORG_ID }));

    const [url, , config] = axiosPost.mock.calls[0];
    expect(url).toBe(`http://localhost:8000/api/v1/organizations/${ORG_ID}/switch/`);
    expect(config.headers.Authorization).toBe(`Bearer ${ACCESS}`);
  });

  it('passes a backend 404 through rather than flattening it', async () => {
    // 404 is the backend's deliberate answer for an organization the caller does
    // not belong to; the UI needs to tell that from "the backend is down".
    const { POST, getToken, axiosPost } = await load();
    getToken.mockResolvedValue({ accessToken: ACCESS });
    axiosPost.mockRejectedValue({ response: { status: 404 } });

    const response = await POST(makeRequest({ organizationId: ORG_ID }));

    expect(response.status).toBe(404);
  });

  it('does not rotate the session when the backend returns no pair', async () => {
    const { POST, getToken, encode, axiosPost } = await load();
    getToken.mockResolvedValue({ accessToken: ACCESS });
    axiosPost.mockResolvedValue({ data: { data: { user: { id: 'u1' } } } });

    const response = await POST(makeRequest({ organizationId: ORG_ID }));

    expect(response.status).toBe(502);
    expect(encode).not.toHaveBeenCalled();
  });
});
