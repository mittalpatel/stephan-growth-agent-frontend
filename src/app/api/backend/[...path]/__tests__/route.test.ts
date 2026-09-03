import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

async function load() {
  const { getToken } = await import('next-auth/jwt');
  const routeModule = await import('../route');
  return { GET: routeModule.GET, POST: routeModule.POST, getToken: getToken as Mock };
}

function makeRequest(path: string, init?: RequestInit & { search?: string }) {
  const search = init?.search ?? '';
  return new NextRequest(`http://localhost:3000${path}${search}`, init);
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env.NEXTAUTH_SECRET = 'test-secret';
  process.env.NEXT_PUBLIC_BACKEND_API = 'http://backend.internal/';
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify({ success: true, data: {} }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
    )
  );
});

describe('GET/POST /api/backend/[...path]', () => {
  it('attaches the access token read from the JWT cookie — never from the client', async () => {
    const { GET, getToken } = await load();
    getToken.mockResolvedValue({ accessToken: 'server-side-token' });

    await GET(makeRequest('/api/backend/api/v1/widgets/'));

    const fetchCall = (fetch as unknown as Mock).mock.calls[0];
    const [url, init] = fetchCall;
    expect(url).toBe('http://backend.internal/api/v1/widgets/');
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer server-side-token');
  });

  it('strips the /api/backend prefix and preserves the query string', async () => {
    const { GET, getToken } = await load();
    getToken.mockResolvedValue({ accessToken: 'token' });

    await GET(makeRequest('/api/backend/api/v1/widgets/', { search: '?page=2&sort=name' }));

    const [url] = (fetch as unknown as Mock).mock.calls[0];
    expect(url).toBe('http://backend.internal/api/v1/widgets/?page=2&sort=name');
  });

  it('sends no Authorization header when there is no session', async () => {
    const { GET, getToken } = await load();
    getToken.mockResolvedValue(null);

    await GET(makeRequest('/api/backend/api/v1/widgets/'));

    const [, init] = (fetch as unknown as Mock).mock.calls[0];
    expect((init.headers as Headers).has('Authorization')).toBe(false);
  });

  it('never forwards the client Authorization header — only what this route attaches itself', async () => {
    const { GET, getToken } = await load();
    getToken.mockResolvedValue({ accessToken: 'real-token' });

    await GET(
      makeRequest('/api/backend/api/v1/widgets/', {
        headers: { Authorization: 'Bearer attacker-supplied-token' },
      })
    );

    const [, init] = (fetch as unknown as Mock).mock.calls[0];
    // Only ever the server-derived token — a client can't override it by
    // sending its own Authorization header to the proxy.
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer real-token');
  });

  it('forwards the request body and Content-Type on POST', async () => {
    const { POST, getToken } = await load();
    getToken.mockResolvedValue({ accessToken: 'token' });

    await POST(
      makeRequest('/api/backend/api/v1/widgets/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Widget' }),
      })
    );

    const [, init] = (fetch as unknown as Mock).mock.calls[0];
    expect(init.method).toBe('POST');
    expect((init.headers as Headers).get('content-type')).toBe('application/json');
    // Buffered (an ArrayBuffer), not streamed — see the route's comment: forwarding
    // `request.body` directly with `duplex: 'half'` was unreliable across Node
    // fetch/undici versions and could deliver a truncated body to the backend.
    expect(init.body).toBeInstanceOf(ArrayBuffer);
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe(
      JSON.stringify({ name: 'Widget' })
    );
    expect(init.duplex).toBeUndefined();
  });

  it('forwards the Accept-Language and Cache-Control headers', async () => {
    const { GET, getToken } = await load();
    getToken.mockResolvedValue({ accessToken: 'token' });

    await GET(
      makeRequest('/api/backend/api/v1/widgets/', {
        headers: { 'Accept-Language': 'en', 'Cache-Control': 'no-cache' },
      })
    );

    const [, init] = (fetch as unknown as Mock).mock.calls[0];
    expect((init.headers as Headers).get('accept-language')).toBe('en');
    expect((init.headers as Headers).get('cache-control')).toBe('no-cache');
  });

  it('proxies the backend status code and body back to the caller', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ success: false, errors: { field: ['bad'] } }), {
            status: 400,
            headers: { 'content-type': 'application/json' },
          })
      )
    );
    const { POST, getToken } = await load();
    getToken.mockResolvedValue({ accessToken: 'token' });

    const response = await POST(makeRequest('/api/backend/api/v1/widgets/', { method: 'POST' }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ success: false, errors: { field: ['bad'] } });
  });

  it('forwards Content-Disposition and Retry-After from the backend response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('csv,data', {
            status: 200,
            headers: {
              'content-type': 'text/csv',
              'content-disposition': 'attachment; filename="export.csv"',
              'retry-after': '30',
            },
          })
      )
    );
    const { GET, getToken } = await load();
    getToken.mockResolvedValue({ accessToken: 'token' });

    const response = await GET(makeRequest('/api/backend/api/v1/widgets/export/'));

    expect(response.headers.get('content-disposition')).toBe('attachment; filename="export.csv"');
    expect(response.headers.get('retry-after')).toBe('30');
  });
});
