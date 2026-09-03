import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { DEFAULT_LANDING } from '@/constants/navItems';
import { backendConnectSrcHosts, backendImgSrcHosts } from '@/lib/backendOrigins';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// CSP is generated here (not in next.config.ts's static `headers()`) because a
// per-request nonce is what makes `script-src` safe to tighten off
// 'unsafe-inline'/'unsafe-eval': any inline <script> without the matching
// nonce is refused, so an XSS payload that injects a <script> tag can no
// longer execute even though React/Next's own inline bootstrap scripts still
// carry the correct nonce automatically (Next detects the nonce on this
// response header and stamps it onto its own injected scripts).
function buildCsp(nonce: string): string {
  // Next's dev server (Fast Refresh, React's dev-mode stack reconstruction)
  // uses eval() for debugging and refuses to run under a CSP that blocks it —
  // hence the console error. Next never uses eval() in a production build, so
  // this widening is dev-only and the production policy is unchanged.
  const scriptSrc =
    process.env.NODE_ENV === 'production'
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`;
  return [
    "default-src 'self'",
    scriptSrc,
    // Tailwind/Radix apply styles via inline `style` attributes at runtime;
    // there is no nonce mechanism for those, so style-src keeps unsafe-inline
    // — a real but much narrower risk than allowing arbitrary inline script.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' data: blob: ${backendImgSrcHosts().join(' ')}`,
    "font-src 'self' https://fonts.gstatic.com",
    // `blob:` is required for `react-pdf`/pdf.js, which `fetch()`s the blob
    // object URL created from the downloaded file bytes (see `useFilePreview`)
    // -- unlike an `<img>`/`<embed src="blob:...">`, that's a `connect-src`
    // concern, not `img-src`/`frame-src`. Without it the browser blocks the
    // fetch outright and pdf.js reports "Unexpected server response (0)".
    `connect-src ${backendConnectSrcHosts().join(' ')} blob:`,
    "frame-src 'self' blob:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');
}

const PUBLIC_PATHS = ['/login', '/forgot-password', '/signup', '/api/auth', '/legal'];

// Routes every authenticated user can access regardless of permissions
const GLOBAL_AUTH_PATHS = ['/no-role', '/user-profile', '/legal'];

// The pages currently reachable in the app. Anything not listed redirects to
// `DEFAULT_LANDING`. A prefix covers all sub-paths, so '/projects' also covers
// '/projects/123'.
//
// This is a **kill switch**, not authorization: it turns a page off for
// everyone at once (an incident, an unfinished feature) without a code change
// beyond this array. Per-user access is `ROUTE_PERMISSIONS` plus, authoritatively,
// the backend.
const ENABLED_PREFIXES: readonly string[] = [
  '/dashboard',
  // Sprint 1 static previews — see navItems.ts for why these have no
  // permission gating yet.
  '/agents',
  '/conversations',
  '/leads',
  '/analytics',
  '/invites',
  '/notifications',
  // Covers /organization, /organization/members, and /organization/roles — the
  // prefix match handles sub-paths, so the children need no entry of their own.
  '/organization',
  // Platform admin. Enabled for everyone here on purpose: the middleware has no
  // way to know whether the user is a superuser without trusting the JWT for an
  // authorization decision. The page redirects server-side and every endpoint
  // behind it re-checks, which is where the gate belongs.
  '/admin',
  // Demo module — removed by `npm run strip-demo`.
  '/projects',
];

function isEnabledPage(pathname: string): boolean {
  return ENABLED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

// Web Crypto (available in both the Edge middleware runtime and Node) rather
// than `node:crypto`, which the Edge runtime doesn't reliably provide.
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function applySecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set('Content-Security-Policy', buildCsp(nonce));
  return response;
}

// `NextResponse.next()` with the nonce forwarded as a request header, so a
// Server Component can read it (via `headers()`) if it ever needs to stamp
// the nonce onto a custom inline <script>/<style> itself — Next's own
// framework-injected scripts pick up the nonce automatically from the
// Content-Security-Policy response header set in applySecurityHeaders.
function nextWithNonce(request: NextRequest, nonce: string): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

// Coarse edge gating for an authenticated request: redirect away from login/root and
// block pages that aren't enabled. Fine-grained per-route permission enforcement is
// NOT done here — permissions no longer live in the JWT, so it happens in the client
// PermissionGuard (seeded by the server layout) and, authoritatively, on the backend.
function handleAuthenticatedRequest(
  request: NextRequest,
  pathname: string,
  isPublic: boolean,
  nonce: string
): NextResponse {
  // Hitting login or root → send to a neutral entry point. The PermissionGuard then
  // bounces the user to their first accessible route (or /no-role) once the
  // server-seeded permissions are available.
  if ((isPublic && pathname.startsWith('/login')) || pathname === '/') {
    return applySecurityHeaders(
      NextResponse.redirect(new URL(DEFAULT_LANDING, request.url)),
      nonce
    );
  }

  // Routes every authenticated user can access regardless of permissions
  if (GLOBAL_AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return applySecurityHeaders(nextWithNonce(request, nonce), nonce);
  }

  // Block access to pages that are not currently enabled
  if (!isEnabledPage(pathname)) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL(DEFAULT_LANDING, request.url)),
      nonce
    );
  }

  return applySecurityHeaders(nextWithNonce(request, nonce), nonce);
}

export async function proxy(request: NextRequest) {
  // CVE-2025-29927 mitigation
  if (request.headers.get('x-middleware-subrequest')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const nonce = generateNonce();
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  // A malformed/forged Authorization header can make getToken() throw — never
  // let that crash the middleware (a DoS against every route it gates).
  // Treat any thrown error as "unauthenticated" instead.
  let token: Awaited<ReturnType<typeof getToken>> | null = null;
  try {
    token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    token = null;
  }

  // Unauthenticated user hitting a protected route → login
  if (!isPublic && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl), nonce);
  }

  if (token) {
    return handleAuthenticatedRequest(request, pathname, isPublic, nonce);
  }

  return applySecurityHeaders(nextWithNonce(request, nonce), nonce);
}

export const config = {
  // Must list every path the middleware should see. A route missing here is not
  // protected — the middleware simply never runs for it — so this array has to be
  // kept in step with the app's routes. Bare paths and their sub-paths are both
  // listed because `/:path*` alone does not match the root segment.
  matcher: [
    '/',
    '/login',
    '/login/:path*',
    '/forgot-password',
    '/signup',
    '/signup/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/agents',
    '/agents/:path*',
    '/conversations',
    '/conversations/:path*',
    '/leads',
    '/leads/:path*',
    '/analytics',
    '/analytics/:path*',
    '/notifications',
    '/notifications/:path*',
    '/user-profile',
    '/no-role',
    '/legal',
    '/legal/:path*',
    // Demo module — removed by `npm run strip-demo`.
    '/projects',
    '/projects/:path*',
    '/organization',
    '/organization/:path*',
    '/admin',
    '/admin/:path*',
  ],
};
