import axios from 'axios';
import { signOut } from 'next-auth/react';
import { clearQueryCache } from '@/lib/queryClientRef';
import { shouldBypassBackendCache } from '@/lib/backendCache';
import { getLanguage } from '@/locales/activeLanguage';

// Same-origin proxy (src/app/api/backend/[...path]/route.ts), not the backend
// origin directly. The access token is never attached here — that route reads
// it from the encrypted, httpOnly JWT cookie server-side and attaches it
// itself, so the token never exists anywhere client JS can read it (not in
// this file, not in the session object — see types/next-auth.d.ts). An XSS
// bug can at most replay requests through the proxy for as long as the tab is
// open; it can no longer exfiltrate a reusable credential.
const axiosAuth = axios.create({
  baseURL: '/api/backend',
  // Browser-only client: read once per page load, and a language switch
  // reloads the page, so this stays the viewer's language.
  headers: { 'Accept-Language': getLanguage() },
});

interface QueueItem {
  resolve: () => void;
  reject: (reason: unknown) => void;
}

let isRefreshing = false;
let failedRequestsQueue: QueueItem[] = [];

function processQueue(error: unknown) {
  failedRequestsQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedRequestsQueue = [];
}

axiosAuth.interceptors.request.use((config) => {
  // After a browser reload, force the backend to skip its Redis cache for the
  // initial burst of reads so the user sees current data (see lib/backendCache).
  // The backend honors `Cache-Control: no-cache` and `?refresh=1` identically; we
  // use the header as the standards-correct signal (keeps URLs/query-keys clean
  // and propagates through any future CDN/proxy). Only GETs are cached
  // server-side, so scope it to them.
  if (config.method?.toLowerCase() === 'get' && shouldBypassBackendCache()) {
    config.headers['Cache-Control'] = 'no-cache';
  }
  return config;
});

/**
 * Config for calling a **same-origin Next.js route** through this client.
 *
 * `axiosAuth` is based at `/api/backend`, so a bare `/api/auth/...` path would be
 * sent to `/api/backend/api/auth/...`. Overriding `baseURL` targets the route
 * directly while keeping everything else this instance provides — in particular
 * the 401 handler below, so a route call made with a stale access token still
 * refreshes and retries instead of surfacing as a failure to the user.
 *
 * Used by the routes that mint token pairs (organization switch, change
 * password), which must run server-side so the refresh token never reaches
 * client JavaScript.
 */
export const SAME_ORIGIN_ROUTE = { baseURL: '/' } as const;

axiosAuth.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      throw error;
    }

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedRequestsQueue.push({ resolve, reject });
      }).then(() => axiosAuth(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Refresh via the same-origin server route; it reads the refresh token from,
      // and writes the rotated tokens back into, the httpOnly JWT cookie — nothing
      // in the response body is needed here. Retrying through the /api/backend
      // proxy afterward picks up the now-rotated access token automatically, since
      // the proxy always reads it fresh from the cookie on every call.
      await axios.post('/api/auth/refresh');

      processQueue(null);
      return axiosAuth(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      // Explicit — don't rely on signOut's full-page navigation to
      // incidentally wipe cached responses past logout.
      clearQueryCache();
      // No need to call /api/auth/logout here — the refresh token is already
      // blacklisted or invalid (that's why refresh failed).
      await signOut({ redirect: true, callbackUrl: '/login' });
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosAuth;
