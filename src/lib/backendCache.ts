// Browser hard-refresh → force-fresh backend reads.
//
// The Django backend caches reads in Redis and only bypasses that cache when a
// request carries `Cache-Control: no-cache` (or `?refresh=1`) — see the backend
// `wants_fresh_data(request)` helper. A plain browser reload does NOT bypass it,
// so after pressing refresh a user still sees the Redis-cached copy until its TTL
// expires. That breaks the intuitive expectation ("I refreshed, give me current
// data").
//
// To match that expectation we detect a *reload* navigation (Navigation Timing
// API) and tag the burst of requests fired during the initial page load with the
// backend's bypass signal (axiosAuth sends `Cache-Control: no-cache`), then resume
// normal caching for the rest of the session. We deliberately do NOT send it on
// every request — that would defeat the backend cache entirely, and the bypass
// re-warms the shared cache for all users.
//
// The backend honors `Cache-Control: no-cache` and `?refresh=1` identically; the
// header is used as the standards-correct signal and is allow-listed in the
// backend CORS config across all environments.

// How long after a reload we keep forcing fresh reads. The initial query burst
// (layout + page data) fires within a second or two of the bundle executing; this
// window comfortably covers it without leaking into later in-session refetches.
const BYPASS_WINDOW_MS = 4000;

function detectReload(): boolean {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') {
    return false;
  }
  const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  // 'reload' covers both a normal (F5) and a hard (Ctrl+Shift+R) refresh — the
  // browser doesn't expose the difference to JS, and either way the user expects
  // current data. Other types ('navigate', 'back_forward') keep normal caching.
  return nav?.type === 'reload';
}

let bypassActive = detectReload();

if (bypassActive && typeof window !== 'undefined') {
  // Close the window once the initial load has settled so ordinary in-session
  // navigation and refetches go back to using the backend cache.
  window.setTimeout(() => {
    bypassActive = false;
  }, BYPASS_WINDOW_MS);
}

// True while requests should signal the backend to skip its Redis cache.
export function shouldBypassBackendCache(): boolean {
  return bypassActive;
}
