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

const PAYLOAD = {
  current_password: 'old-Passw0rd!',
  new_password: 'new-Passw0rd!',
  confirm_password: 'new-Passw0rd!',
};

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

function makeRequest(body: unknown = PAYLOAD) {
  return new NextRequest('http://localhost:3000/api/auth/change-password', {
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

describe('POST /api/auth/change-password', () => {
  it('returns 401 without a session', async () => {
    const { POST, getToken } = await load();
    getToken.mockResolvedValue(null);

    expect((await POST(makeRequest())).status).toBe(401);
  });

  // The reason this route exists rather than using the generic backend proxy.
  it('never returns the replacement token pair to the client', async () => {
    const { POST, getToken, encode, axiosPost } = await load();
    getToken.mockResolvedValue({ accessToken: ACCESS, exp: 9_999_999_999 });
    encode.mockResolvedValue('encoded-cookie');
    axiosPost.mockResolvedValue({
      data: { message: 'Password changed.', data: { access: NEW_ACCESS, refresh: NEW_REFRESH } },
    });

    const response = await POST(makeRequest());
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).not.toContain(NEW_REFRESH);
    expect(body).not.toContain(NEW_ACCESS);
    expect(JSON.parse(body)).toMatchObject({ message: 'Password changed.', data: null });
  });

  it('writes the replacement pair into the session cookie', async () => {
    const { POST, getToken, encode, axiosPost } = await load();
    getToken.mockResolvedValue({ accessToken: ACCESS, exp: 9_999_999_999 });
    encode.mockResolvedValue('encoded-cookie');
    axiosPost.mockResolvedValue({
      data: { data: { access: NEW_ACCESS, refresh: NEW_REFRESH } },
    });

    const response = await POST(makeRequest());

    const encoded = encode.mock.calls[0][0];
    expect(encoded.token.accessToken).toBe(NEW_ACCESS);
    expect(encoded.token.backendRefreshToken).toBe(NEW_REFRESH);
    expect(response.cookies.get('next-auth.session-token')?.httpOnly).toBe(true);
  });

  it('passes validation errors through so the form can bind them inline', async () => {
    const { POST, getToken, axiosPost } = await load();
    getToken.mockResolvedValue({ accessToken: ACCESS });
    const errors = { errors: { current_password: ['Current password is incorrect.'] } };
    axiosPost.mockRejectedValue({ response: { status: 400, data: errors } });

    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(errors);
  });

  it('does not rotate the session when a change is rejected', async () => {
    const { POST, getToken, encode, axiosPost } = await load();
    getToken.mockResolvedValue({ accessToken: ACCESS });
    axiosPost.mockRejectedValue({ response: { status: 400, data: {} } });

    await POST(makeRequest());

    expect(encode).not.toHaveBeenCalled();
  });
});
