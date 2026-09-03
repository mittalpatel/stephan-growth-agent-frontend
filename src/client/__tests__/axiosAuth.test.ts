import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { AxiosInstance } from 'axios';

// axiosAuth keeps module-level refresh state (the in-flight flag and the queue),
// so each test re-imports a fresh module via resetModules and drives the
// interceptors directly. The instance's request adapter is replaced with a mock
// so the retried request resolves without a real network call.
//
// No Authorization-header attachment to test here anymore — that moved
// server-side into src/app/api/backend/[...path]/route.ts (see that file's own
// tests). This file only covers what's still client-side: the cache-bypass
// header and the 401 → refresh → retry flow.

type TestConfig = { headers: Record<string, string>; _retry?: boolean; method?: string };
type TestError = { response?: { status: number }; config: TestConfig };
type AdapterResponse = { data: unknown; status: number; statusText: string; headers: object };

type ReqHandler = (c: TestConfig) => TestConfig;
type ResRejected = (e: TestError) => Promise<AdapterResponse>;
type HandlerEntry<H> = { fulfilled: H; rejected: H };

function requestInterceptor(instance: AxiosInstance): ReqHandler {
  const mgr = instance.interceptors.request as unknown as { handlers: HandlerEntry<ReqHandler>[] };
  return mgr.handlers[0].fulfilled;
}

function responseRejected(instance: AxiosInstance): ResRejected {
  const mgr = instance.interceptors.response as unknown as {
    handlers: HandlerEntry<ResRejected>[];
  };
  return mgr.handlers[0].rejected;
}

async function load() {
  const axios = (await import('axios')).default;
  const post = vi.spyOn(axios, 'post') as unknown as Mock;
  const { signOut } = await import('next-auth/react');
  const axiosAuth = (await import('@/client/axiosAuth')).default;

  // Resolve retried requests without hitting the network.
  const adapter = vi.fn(
    async (): Promise<AdapterResponse> => ({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
    })
  );
  axiosAuth.defaults.adapter = adapter as unknown as AxiosInstance['defaults']['adapter'];

  return {
    axiosAuth,
    refreshPost: post,
    signOut: signOut as unknown as Mock,
    adapter,
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('axiosAuth baseURL', () => {
  it('points at the same-origin proxy, never the backend origin directly', async () => {
    const { axiosAuth } = await load();
    expect(axiosAuth.defaults.baseURL).toBe('/api/backend');
  });

  it('never attaches an Authorization header — the proxy attaches it server-side', async () => {
    const { axiosAuth } = await load();
    const config = requestInterceptor(axiosAuth)({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });
});

describe('axiosAuth backend-cache bypass', () => {
  // After a browser reload the user expects current data, but the backend serves
  // its Redis copy unless asked not to. These cover both halves of that rule —
  // the bypass firing on a reload, and it staying off otherwise, since sending
  // the header unconditionally would defeat the backend cache for everyone.

  it('tags GETs with Cache-Control: no-cache while the bypass window is open', async () => {
    vi.doMock('@/lib/backendCache', () => ({ shouldBypassBackendCache: () => true }));
    const { axiosAuth } = await load();

    const config = requestInterceptor(axiosAuth)({ headers: {}, method: 'get' });

    expect(config.headers['Cache-Control']).toBe('no-cache');
  });

  it('leaves non-GET requests alone — only reads are cached server-side', async () => {
    vi.doMock('@/lib/backendCache', () => ({ shouldBypassBackendCache: () => true }));
    const { axiosAuth } = await load();

    const config = requestInterceptor(axiosAuth)({ headers: {}, method: 'post' });

    expect(config.headers['Cache-Control']).toBeUndefined();
  });

  it('sends no bypass header once the window has closed', async () => {
    vi.doMock('@/lib/backendCache', () => ({ shouldBypassBackendCache: () => false }));
    const { axiosAuth } = await load();

    const config = requestInterceptor(axiosAuth)({ headers: {}, method: 'get' });

    expect(config.headers['Cache-Control']).toBeUndefined();
  });
});

describe('axiosAuth response interceptor', () => {
  it('rethrows non-401 errors untouched', async () => {
    const { axiosAuth, refreshPost } = await load();
    const error: TestError = { response: { status: 500 }, config: { headers: {} } };

    await expect(responseRejected(axiosAuth)(error)).rejects.toBe(error);
    expect(refreshPost).not.toHaveBeenCalled();
  });

  it('does not retry a request that already retried (no refresh loop)', async () => {
    const { axiosAuth, refreshPost } = await load();
    const error: TestError = { response: { status: 401 }, config: { headers: {}, _retry: true } };

    await expect(responseRejected(axiosAuth)(error)).rejects.toBe(error);
    expect(refreshPost).not.toHaveBeenCalled();
  });

  it('on 401: refreshes and retries the request through the proxy', async () => {
    const { axiosAuth, refreshPost, signOut, adapter } = await load();
    refreshPost.mockResolvedValue({ data: { refreshed: true } });

    const result = await responseRejected(axiosAuth)({
      response: { status: 401 },
      config: { headers: {} },
    });

    expect(refreshPost).toHaveBeenCalledWith('/api/auth/refresh');
    expect(adapter).toHaveBeenCalledTimes(1); // original request retried
    expect(result.data).toEqual({ ok: true });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('on refresh failure: signs out and rethrows', async () => {
    const { axiosAuth, refreshPost, signOut } = await load();
    const refreshError = new Error('refresh failed');
    refreshPost.mockRejectedValue(refreshError);

    await expect(
      responseRejected(axiosAuth)({ response: { status: 401 }, config: { headers: {} } })
    ).rejects.toBe(refreshError);

    expect(signOut).toHaveBeenCalledWith({ redirect: true, callbackUrl: '/login' });
  });

  it('refreshes once for concurrent 401s and replays the queued request', async () => {
    const { axiosAuth, refreshPost, adapter } = await load();
    let resolveRefresh!: (v: { data: { refreshed: boolean } }) => void;
    refreshPost.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      })
    );

    // First 401 starts the refresh; second arrives while it's in flight → queued.
    const first = responseRejected(axiosAuth)({
      response: { status: 401 },
      config: { headers: {} },
    });
    const second = responseRejected(axiosAuth)({
      response: { status: 401 },
      config: { headers: {} },
    });

    resolveRefresh({ data: { refreshed: true } });
    const [r1, r2] = await Promise.all([first, second]);

    expect(refreshPost).toHaveBeenCalledTimes(1); // single refresh for both
    expect(adapter).toHaveBeenCalledTimes(2); // both requests replayed
    expect(r1.data).toEqual({ ok: true });
    expect(r2.data).toEqual({ ok: true });
  });
});
