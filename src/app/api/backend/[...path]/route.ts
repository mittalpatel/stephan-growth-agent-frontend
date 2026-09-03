import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Same-origin proxy for every authenticated backend call.
 *
 * The browser talks to `/api/backend/*` instead of the Django origin directly, and
 * `src/client/axiosAuth.ts` never attaches an `Authorization` header itself — this
 * route reads the access token from the encrypted, httpOnly JWT cookie server-side
 * and attaches it here. That is what keeps the access token out of client JS
 * entirely: previously it was exposed via `session.accessToken`
 * (`useSession()`/`getSession()`/`GET /api/auth/session`, all client-reachable), so
 * any XSS on the page could read a live, usable backend credential straight off the
 * session. Routing every call through here instead means an XSS payload can at most
 * replay requests through *this* proxy for as long as the browser tab lives — it
 * still can never read or exfiltrate the raw token itself.
 *
 * A generic pass-through, not a per-endpoint allowlist: it forwards method, path,
 * query string, request body, and a curated header set in both directions, so
 * adding a new backend endpoint never requires touching this file.
 */

const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_BACKEND_API ?? 'http://localhost:8000/').replace(
  /\/$/,
  ''
);

//: Headers worth forwarding from the browser's request to the backend. Not a
// blanket forward — `Host`, `Cookie`, `Connection`, etc. are same-origin/Next.js
// concerns that must not leak through to a cross-service call.
const FORWARD_REQUEST_HEADERS = ['accept-language', 'cache-control', 'content-type'];

//: Headers worth forwarding from the backend's response back to the browser.
const FORWARD_RESPONSE_HEADERS = ['content-type', 'content-disposition', 'retry-after'];

async function proxy(request: NextRequest): Promise<NextResponse> {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // No session at all — let the request through unauthenticated rather than
  // refusing outright. Some proxied endpoints may be intentionally public
  // (e.g. none today, but a future one shouldn't need a frontend code change
  // to stop being gated here); the backend's own permission classes are the
  // real, authoritative gate either way.
  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (token?.accessToken) {
    headers.set('Authorization', `Bearer ${token.accessToken}`);
  }

  // Next.js strips a trailing slash from the incoming request path before this
  // handler ever runs (a `[...path]/` URL 308-redirects to the same path
  // without it) — so the trailing slash Django's APPEND_SLASH requires on
  // every endpoint can't be relied on to survive from the original request.
  // Every route this app proxies to is slash-terminated, so restore it here
  // rather than let Django's own APPEND_SLASH redirect become one more
  // silently-broken hop (this fetch call uses `redirect: 'manual'`, so a
  // Django redirect would otherwise reach the browser as an opaque 3xx
  // instead of data).
  let targetPath = request.nextUrl.pathname.replace(/^\/api\/backend/, '');
  if (!targetPath.endsWith('/')) targetPath += '/';
  const targetUrl = `${BACKEND_ORIGIN}${targetPath}${request.nextUrl.search}`;

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  // Buffered, not streamed: forwarding `request.body` directly as a `ReadableStream`
  // (with `duplex: 'half'`) is unreliable across Node's fetch/undici versions for
  // small bodies — the backend can receive a truncated or empty payload with no
  // client-visible error, which surfaced as spurious "this field is required" 400s
  // on endpoints like organization creation. Buffering trades streaming-upload
  // support (not needed here; large uploads go through a dedicated path) for a body
  // that reliably arrives intact.
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const backendResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
  });

  const responseHeaders = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = backendResponse.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
