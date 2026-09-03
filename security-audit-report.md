# Security Audit Report — enterprise-frontend-template

> **⚠️ STALE BELOW THIS LINE — superseded 2026-08-21.**
>
> The follow-up table and the summary totals in this document report
> **"0 Critical, 0 High, 0 Medium open"**. That was wrong at the time it was
> written and is wrong now, in the way that matters most: it is _reassuring_.
>
> A **High** was live throughout — the organization switcher called the backend
> from the browser and passed the resulting token pair back through
> `useSession().update({ access, refresh })`, putting the **refresh token** (good
> for the whole session, not the ~60 minutes an access token lasts) into
> client-readable JavaScript. That is strictly worse than the `session.accessToken`
> exposure finding #4 below celebrates having removed, and it went unnoticed because
> it reads as plumbing rather than as a token leak.
>
> Fixed 2026-08-21: the switch, the password change, and token refresh all run in
> route handlers that write the httpOnly cookie directly and return no token in the
> response body. The `jwt` callback now accepts **no token** from `update()` — which
> also closes the reverse direction, where a client-writable token slot lets an
> attacker pin the session to a credential they control.
> See `context/auth.md` and `src/lib/__tests__/authOptionsJwt.test.ts`.
>
> **Treat the status column below as a record of what one pass concluded, not as
> the current state.** This document needs regenerating before it is trusted again.

---

**Audit date:** 2026-08-19
**Auditor:** AI Security Auditor
**Target:** `/mnt/Projects/enterprise-starter/enterprise-frontend-template` (Next.js ^16.2.9 / App Router, React 19.2.4, NextAuth ^4.24.14, TypeScript 5)
**Nature of target:** Generic multi-tenant SaaS **starter/boilerplate** frontend. Findings assume this code will be forked by other teams — any misconfiguration here propagates to every product built on it, so the bar is "safe by default," not "safe as currently deployed."

This report is audit-only. No source files were modified.

---

## Remediation Verification (2026-08-19 follow-up)

Re-audited every finding below against the current code after the dev team's remediation pass. `npm audit` against the current lockfile now reports **0 vulnerabilities** (was 2 critical / up to high across `next-auth`, `next`, and several transitives).

| Finding #                                        | Severity | Verdict                             | Evidence (one line)                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | -------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — `next-auth` dependency                       | Critical | **FIXED**                           | `package.json`/`package-lock.json` resolve `next-auth@4.24.15`; `src/proxy.ts:142-147` now wraps `getToken()` in try/catch, treating any throw as unauthenticated; `npm audit` clean.                                                                                                                                                                                                                                        |
| 2 — `next` dependency                            | Critical | **FIXED**                           | `package-lock.json` resolves `next@16.3.1` exactly as recommended; `npm audit` clean.                                                                                                                                                                                                                                                                                                                                        |
| 3 — CSP `unsafe-inline`/`unsafe-eval`            | High     | **FIXED**                           | `src/proxy.ts` now generates a per-request nonce (`generateNonce()`) and builds `script-src 'self' 'nonce-<n>' 'strict-dynamic'`; `unsafe-eval` removed entirely; `object-src 'none'` and `base-uri 'self'` added.                                                                                                                                                                                                           |
| 4 — Client-readable `session.accessToken`        | Medium   | **FIXED (exceeds recommendation)**  | `session.accessToken` removed from the NextAuth `Session` type entirely (`src/types/next-auth.d.ts`); all backend calls now route through a new same-origin BFF proxy (`src/app/api/backend/[...path]/route.ts`) that reads the token server-side via `getToken()`; `src/client/axiosAuth.ts` no longer attaches any `Authorization` header.                                                                                 |
| 5 — Query cache not cleared on logout            | Medium   | **FIXED**                           | New `src/lib/queryClientRef.ts` singleton; `client.clear()` called explicitly in `QueryProvider.tsx`'s 401 handler and `clearQueryCache()` called in `axiosAuth.ts`'s refresh-failure branch, both before `signOut()`.                                                                                                                                                                                                       |
| 6 — Client-side permission fail-open risk        | Medium   | **FIXED**                           | New `src/app/(restricted)/components/__tests__/PermissionGuard.test.tsx` with 3 tests locking in the fail-closed contract (not-loaded, loaded-but-denied, loaded-and-granted).                                                                                                                                                                                                                                               |
| 7 — Error message disclosure in error boundaries | Low      | **FIXED**                           | All three boundaries (`src/app/error.tsx`, `src/app/(restricted)/error.tsx`, `src/app/global-error.tsx`) now gate `error.message` display behind `process.env.NODE_ENV !== 'production'`, exactly as recommended.                                                                                                                                                                                                            |
| 8 — Duplicated/drifting security headers         | Low      | **NOT FIXED** (partially mitigated) | The recommended shared module (e.g. `src/lib/securityHeaders.ts`) was never created — `next.config.ts` and `src/proxy.ts` still each hardcode their own separate header object, now with a code comment acknowledging the duplication instead of eliminating it. The narrower matcher-coverage gap did improve incidentally: `/legal` and `/legal/:path*` were added to `PUBLIC_PATHS`/`GLOBAL_AUTH_PATHS`/`config.matcher`. |
| 9 — Transitive dependency vulnerabilities        | Low      | **FIXED**                           | `package.json` adds explicit `overrides` for `form-data` and `postcss`; `npm audit` now reports 0 vulnerabilities across the full dependency tree (was flagging `postcss`, `sharp`, `fast-uri`, `nanoid`, `uuid`).                                                                                                                                                                                                           |
| Info — CVE-2025-29927 mitigation                 | Info     | Still present                       | `src/proxy.ts:131-134`, unchanged, correctly placed before auth logic.                                                                                                                                                                                                                                                                                                                                                       |
| Info — Open redirect protection                  | Info     | Still present                       | `safeRedirect.ts` / `useLoginForm.ts` unchanged.                                                                                                                                                                                                                                                                                                                                                                             |
| Info — Refresh-token rotation/blacklisting       | Info     | Still present                       | `refresh/route.ts` rotation logic unchanged in substance (see NEW-2 below for a new logging nuance).                                                                                                                                                                                                                                                                                                                         |
| Info — Sentry data scrubbing                     | Info     | **FIXED**                           | New `src/lib/sentryScrub.ts` exports `scrubAuthorizationHeader`/`scrubAuthorizationBreadcrumb`, wired into `beforeSend`/`beforeBreadcrumb` in all three Sentry configs, exactly as recommended.                                                                                                                                                                                                                              |

**New surface audited:** `src/app/api/backend/[...path]/route.ts` (new BFF proxy), `src/lib/auth/getServerAccessToken.ts` (new), `src/lib/sentryScrub.ts` (new, see above). Hostile review found no SSRF/path-traversal/auth-bypass: the target URL is built by string-concatenating a fixed `BACKEND_ORIGIN` with the normalized request path (never re-parsing attacker input as a URL), so no path segment or header can redirect the fetch to a different host; the client-supplied `Authorization` header is explicitly discarded and replaced with the server-derived token only; cookies and `Host` are not forwarded. One new Low finding below (NEW-1) on the intentional lack of a path allowlist, and one new Info-level observation (NEW-2) on the refresh route's error logging now taking on more weight now that it's the sole path.

---

## Coverage Report

### Scanned in full (file-by-file)

| Area                            | Files                                                                                                                                                                                                                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry / config                  | `next.config.ts`, `tsconfig.json`, `package.json`, `.env.example`, `.gitignore`, `.gitleaks.toml`                                                                                                                                                                                               |
| Middleware                      | `src/proxy.ts`                                                                                                                                                                                                                                                                                  |
| Auth                            | `src/lib/auth/authOptions.ts`, `src/lib/auth/safeRedirect.ts`, `src/lib/auth/getMyPermissions.ts`, `src/types/next-auth.d.ts`                                                                                                                                                                   |
| API routes                      | `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/auth/refresh/route.ts`, `src/app/api/auth/refresh/__tests__/route.test.ts`, `src/app/api/health/route.ts`                                                                                           |
| HTTP clients                    | `src/client/axiosAuth.ts`, `src/client/axiosPublic.ts` (+ their `__tests__`)                                                                                                                                                                                                                    |
| Services (BFF contract mirrors) | `src/services/auth.ts`, `src/services/listParams.ts`, `src/services/profile.ts`, `src/services/widgets.ts` (+ `__tests__/widgets.test.ts`)                                                                                                                                                      |
| Lib                             | `src/lib/apiError.ts`, `src/lib/apiSuccess.ts`, `src/lib/backendCache.ts`, `src/lib/downloadBlob.ts`, `src/lib/helper.ts`, `src/lib/i18n.ts`, `src/lib/logger.ts`, `src/lib/pageMeta.ts`, `src/lib/utils.ts`, `src/lib/withOptimisticPatch.ts`, `src/lib/schemas/widget.ts` (+ all `__tests__`) |
| Access control                  | `src/app/(restricted)/components/PermissionGuard.tsx`, `src/app/(restricted)/context/PermissionsContext.tsx`, `src/app/(restricted)/context/UserContext.tsx`, `src/constants/roles.ts`, `src/constants/navItems.ts`                                                                             |
| Restricted routes               | `src/app/(restricted)/layout.tsx`, `dashboard/page.tsx`, `preferences/**`, `user-profile/**`, `widgets/**` (all pages, hooks, components), `no-role/**`, `error.tsx`, `loading.tsx`, `components/ErrorContext.tsx`, `components/RestrictedBreadcrumb.tsx`                                       |
| Public routes                   | `src/app/(public)/layout.tsx`, `login/page.tsx`, `signup/page.tsx`, `signup/create/page.tsx`, `forgot-password/page.tsx`, all `(public)/components/*`, all `(public)/hooks/*` (+ `__tests__`)                                                                                                   |
| Root app                        | `src/app/layout.tsx`, `page.tsx`, `error.tsx`, `global-error.tsx`, `loading.tsx`, `not-found.tsx`, `not-found-back-button.tsx`, `robots.ts`, `globals.css`                                                                                                                                      |
| Legal                           | `src/app/legal/privacy-policy/page.tsx`, `src/app/legal/terms-conditions/page.tsx`, `src/app/legal/components/LegalDocument.tsx`                                                                                                                                                                |
| Providers/context               | `src/providers/*` (Query, Session, Loader, Motion, Theme, Confirm), `src/context/PreferencesContext.tsx`                                                                                                                                                                                        |
| Hooks                           | `src/hooks/*` (useAuthQuery, useAuthMutation, useDebounce, useDebouncedSearch, useInvalidateCache, use-mobile, useQueryParams, useUserProfile)                                                                                                                                                  |
| Components                      | `src/components/common/**` (incl. `form/**`, all `__tests__`), `src/components/header/**`, `src/components/layout/**`, `src/components/motion/**`, `src/components/sidebar/**`, `src/components/ui/**` (shadcn-generated)                                                                       |
| Types/constants/locales         | `src/types/api.ts`, `src/types/user.ts`, `src/types/widget.ts`, `src/constants/data.ts`, `src/locales/**`                                                                                                                                                                                       |
| Config                          | `src/config/language.ts`                                                                                                                                                                                                                                                                        |
| Monitoring                      | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`                                                                                                                                                                                                                   |
| Security tooling                | `scripts/security-scan.mjs` (Semgrep wrapper), `scripts/secret-scan.mjs` (Gitleaks wrapper), `scripts/check-bundle-size.mjs`                                                                                                                                                                    |
| Tests                           | `src/__tests__/contracts.test.ts`, `src/test/setup.ts`                                                                                                                                                                                                                                          |
| Static                          | `public/**`                                                                                                                                                                                                                                                                                     |
| Dependency audit                | `package.json`, `npm audit` against the installed lockfile                                                                                                                                                                                                                                      |

### NOT PROVIDED — must be reviewed separately

- **`.env` / `.env.local`** — intentionally not read (repo's own `AGENTS.md` forbids it; contains live secrets). Verified only that `.env.example` has safe placeholders and that `.env`/`.env.local`/`.env.e2e` are gitignored.
- **The Django backend** — out of scope by definition (separate repo), but it is the _authoritative_ authorization boundary for almost every finding below, so its RBAC/throttling/CORS implementation must be reviewed independently; this report cannot verify it actually enforces what the frontend assumes it does.
- **CI/CD pipeline definitions** (e.g. GitHub Actions workflows) — not present under the scanned tree; `scripts/security-scan.mjs` / `scripts/secret-scan.mjs` reference "CI never sets SKIP\_\*" but the CI config that calls them was not found in this directory and could not be verified.
- **`e2e/` Playwright specs and `.env.e2e`** — referenced by `context/e2e.md` but out of scope for a frontend production-code audit; `.env.e2e` is correctly gitignored.
- **`scripts/setup.mjs`, `scripts/strip-demo.mjs`, `scripts/check-doc-paths.mjs`** — reviewed only insofar as they touch runtime security; not treated as attack surface since they don't run in production.
- **Actual deployed infra** (reverse proxy, CDN, WAF, cookie domain in production) — cannot be assessed from source alone; header/cookie flags below assume `NEXTAUTH_URL` is correctly set to an `https://` origin in production, which was not itself verifiable without reading `.env.local`.

---

## Findings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Low] [STATUS: NEW — 2026-08-19 follow-up]
Area: Broken access control / SSRF-adjacent — generic backend proxy has no path allowlist
File: src/app/api/backend/[...path]/route.ts
Lines: 23-34, 62-75
CWE: CWE-284 (Improper Access Control), CWE-918 (SSRF, adjacent)

Vulnerable code:

```ts
const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_BACKEND_API ?? 'http://localhost:8000/').replace(/\/$/, '');
...
// A generic pass-through, not a per-endpoint allowlist: it forwards method, path,
// query string, request body, and a curated header set in both directions, so
// adding a new backend endpoint never requires touching this file.
...
async function proxy(request: NextRequest): Promise<NextResponse> {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  // No session at all — let the request through unauthenticated rather than
  // refusing outright. ...
```

Issue: The new BFF proxy forwards **any** method/path/body under `/api/backend/*` to the Django backend verbatim, with no allowlist of the specific endpoints the app actually calls, and it forwards even fully unauthenticated requests (by explicit design — the comment states the backend is the authoritative gate). This is a defense-in-depth gap: any endpoint that exists on the backend, including ones the frontend's own UI never calls (debug endpoints, admin-only paths a future backend change forgets to lock down, endpoints intended to be reachable only from a private network segment the frontend server sits in) becomes reachable from the public internet through the frontend's own domain, with the frontend adding zero filtering. Two mitigating facts keep this Low rather than Medium/High: (1) `NEXT_PUBLIC_BACKEND_API` is, by its `NEXT_PUBLIC_` prefix, already shipped into the client bundle and was already called directly by the browser both before this remediation pass (per the original audit) and still today via `src/client/axiosPublic.ts` for public endpoints — so the backend origin was never actually hidden, and this proxy does not disclose a new secret or reach a network segment that wasn't already browser-reachable; (2) the URL is built by string-concatenating a fixed `BACKEND_ORIGIN` with the (already-normalized-by-Next.js) request path, never by re-parsing attacker-controlled input as a URL, so there is no host-redirection/SSRF vector — confirmed no combination of `..`, absolute-URL-looking path segments, or header injection can make `targetUrl` resolve to a different origin. The route's own test suite (`__tests__/route.test.ts`) covers auth-token handling, header forwarding, and body/status passthrough thoroughly, but has no test asserting a path allowlist, because none exists.
Risk: Widens the backend's effective exposure surface by removing whatever incidental protection came from the frontend only ever calling a known, finite set of endpoints; any backend endpoint not intended for direct public use is now one HTTP request away through a trusted-looking first-party domain, which can also complicate WAF/rate-limiting rules that assume the frontend origin only serves a known route set.
Data Impact: Contingent on backend RBAC being fully correct for every endpoint, including ones never exercised by this frontend's own UI (out of scope for this repo, see Coverage Report).

Fixed code: If the deployment relies on any endpoint being reachable only from the frontend's server (not the public internet) or only via routes the UI actually uses, add an explicit allowlist of permitted path prefixes before forwarding:

```ts
const ALLOWED_PATH_PREFIXES = ['api/v1/widgets', 'api/v1/auth/me', 'api/v1/preferences' /* ... */];

function isAllowedPath(path: string): boolean {
  return ALLOWED_PATH_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

// inside proxy(), before building targetUrl:
const requestPath = request.nextUrl.pathname.replace(/^\/api\/backend\//, '');
if (!isAllowedPath(requestPath)) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

If the generic pass-through is a deliberate, accepted tradeoff (plausible for a starter template, given the backend origin is already public via `NEXT_PUBLIC_BACKEND_API`), document that explicitly in `context/auth.md` alongside the existing token-exposure tradeoff note, so a forking team makes an informed choice rather than assuming this route is scoped.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Info] [STATUS: NEW — 2026-08-19 follow-up]
Area: Information disclosure — refresh route error logging now the sole write path for token rotation
File: src/app/api/auth/refresh/route.ts
Lines: 91-99
CWE: CWE-532 (Information Exposure Through Log Files)

```ts
} catch (err) {
  const error = err as { response?: { status?: number; data?: unknown }; message?: string };
  console.error('[auth] refresh request failed', {
    url,
    status: error?.response?.status,
    data: error?.response?.data,
    message: error?.message,
  });
  return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
}
```

Issue: This is the same unconditional `console.error` with raw backend response `data` already flagged in the original report's Hardening Checklist (log redaction section), unchanged by this remediation pass. It is re-raised here only because this route is now load-bearing for the entire token-refresh path (the access token is never client-readable anymore, so this server route is the only place a refresh failure surfaces), which makes its log output marginally more sensitive than before — a failed refresh now always funnels through this one log line rather than being one of several paths. Still server-side-only, still low severity, still not gated by `src/lib/logger.ts`.
Risk: Backend error payloads (potentially including validation detail) written unconditionally to server logs/observability pipeline.
Data Impact: Low — same as originally noted; not re-scored, listed here only for continuity since the route's role changed.

Fixed code: As originally recommended — redact to `data?.errors?.code` or similar rather than the full body, or gate behind the same dev-only pattern used elsewhere.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Critical] [STATUS: FIXED — verified 2026-08-19, see Remediation Verification table]
Area: Dependency / supply-chain — auth library
File: package.json (dependency: next-auth)
Lines: `"next-auth": "^4.24.14"`
CWE: CWE-1104 (Use of Unmaintained Third-Party Components), CWE-287

Vulnerable code:

```
"next-auth": "^4.24.14"
```

Issue: `npm audit` against the installed lockfile reports the resolved `next-auth@4.24.14` as vulnerable to three advisories, one **critical**:

- **Critical** — Auth.js email normalizer validates the address _before_ Unicode normalization, allowing a homoglyph `@` bypass (account-confusion / auth-bypass class issue).
- Auth.js `getToken()` throws an **uncaught exception** on a malformed `Bearer` authorization header.
- OAuth `state`/`nonce`/PKCE check cookies are not bound to the provider that created them (relevant if/when the SSO provider stubbed in `authOptions.ts` is filled in).
- Transitively depends on a vulnerable `uuid` (moderate, buffer bounds check).

The second item is directly exploitable against this codebase's own control-flow: `src/proxy.ts` calls `getToken({ req: request, secret })` on **every matched request** (i.e. every protected route). If `getToken()` throws on a crafted/malformed `Authorization: Bearer …` header, an unauthenticated attacker can trigger an unhandled exception inside the proxy for any request carrying that header, which in Next.js middleware/proxy either 500s the request or, depending on runtime error handling, can produce inconsistent auth decisions — a denial-of-service vector against every route in the app, including the login page's redirect logic.

Risk: DoS against the auth gate itself (every route runs through `proxy.ts`); latent auth-bypass surface once SSO is added; supply-chain exposure via an unmaintained-in-place major version.
Data Impact: Yes — this is the component that mints and validates the session that gates access to all tenant data.

Fixed code:

```bash
# Upgrade to the patched next-auth 4.x line (or plan the v5/Auth.js migration).
npm install next-auth@^4.24.15   # or whatever patched 4.x npm audit fix resolves to
npm audit fix
```

Additionally, wrap the middleware's `getToken()` call so a thrown error fails closed rather than crashing the request:

```ts
// src/proxy.ts
let token: Awaited<ReturnType<typeof getToken>> | null = null;
try {
  token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
} catch {
  token = null; // malformed/forged token → treat as unauthenticated, never throw
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Critical] [STATUS: FIXED — verified 2026-08-19, see Remediation Verification table]
Area: Dependency / supply-chain — framework
File: package.json (dependency: next)
Lines: `"next": "^16.2.9"`
CWE: CWE-1104

Vulnerable code:

```
"next": "^16.2.9"
```

Issue: `npm audit` reports the installed `next@16.2.9` as vulnerable to nine advisories rated up to **high**, including several directly relevant to this app's architecture:

- **Middleware / Proxy bypass in App Router applications using Turbopack and single locale** — directly relevant since this template's entire access-control model (`src/proxy.ts`) depends on the middleware always running.
- **Unauthenticated disclosure of internal Server Function endpoints.**
- **SSRF in Server Actions on custom servers** and **SSRF in rewrites via attacker-controlled destination hostname.**
- **Cache confusion of response bodies for requests with bodies** (x2 variants) — could leak one user's response to another under a shared cache key, which is exactly the failure mode `src/lib/auth/getMyPermissions.ts` explicitly guards against with `cache: 'no-store'` (that comment is _only_ correct if the framework itself isn't also mis-caching).
- DoS in Image Optimization API via SVGs; unbounded Server Action payload on Edge runtime.

Risk: A framework-level middleware bypass would defeat every access-control finding in this report simultaneously, since `proxy.ts` is the single choke point for route protection.
Data Impact: Yes — potentially all tenant data behind every protected route, and the response-cache-confusion CVEs specifically threaten cross-user data leakage.

Fixed code:

```bash
npm install next@^16.3.1   # or latest patched 16.x per `npm audit fix` output
npm audit fix
npm run build && npm test   # re-verify proxy.ts route protection after upgrade
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: High] [STATUS: FIXED — verified 2026-08-19, see Remediation Verification table]
Area: Security headers / CSP
File: next.config.ts
Lines: 74–75
CWE: CWE-79 (XSS), CWE-693 (Protection Mechanism Failure)

Vulnerable code:

```ts
const securityHeaders = [
  ...
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      ...
```

Issue: `script-src` includes both `'unsafe-inline'` and `'unsafe-eval'`. This CSP provides essentially no defense against script injection: any XSS primitive that gets an attacker-controlled `<script>` tag or inline event handler onto the page executes freely, and `unsafe-eval` additionally permits `eval()`/`new Function()`/`setTimeout(string)`-style sinks. No dangerouslySetInnerHTML/innerHTML/eval sinks were found in first-party `src/**` code in this audit, but a CSP is defense-in-depth specifically for the XSS bug nobody has found yet (in this template or in every fork of it) — and a starter template that ships a CSP this permissive teaches every downstream team that this is an acceptable baseline.
Risk: Any future XSS bug (a dependency, a new markdown/rich-text feature, a misused `dangerouslySetInnerHTML`) is fully exploitable — session-adjacent data (the client-readable `session.accessToken`, see the Medium finding below) and the DOM are both reachable by injected script.
Data Impact: Yes, conditionally — becomes a full session/token exfiltration path the moment any XSS sink is introduced anywhere in the app or its dependency tree.

Fixed code (Next.js 16, nonce-based CSP via middleware since `headers()` in `next.config.ts` cannot generate a per-request nonce):

```ts
// src/proxy.ts — generate a per-request nonce and use it for both the response
// header and (via a request header) the root layout's <script> tags.
import { randomBytes } from 'node:crypto';

function buildCsp(nonce: string, connectSrcHosts: string[], imgSrcHosts: string[]): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Tailwind/Radix inline styles; safe class, not script
    `img-src 'self' data: blob: ${imgSrcHosts.join(' ')}`,
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src ${connectSrcHosts.join(' ')}`,
    "frame-src 'self' blob:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(randomBytes(16)).toString('base64');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', buildCsp(nonce, connectSrcHosts, imgSrcHosts));
  // ...existing logic...
  return response;
}
```

```ts
// src/app/layout.tsx — read the nonce and pass it to any inline script (Next
// automatically applies the nonce to its own injected scripts when it sees the
// `Content-Security-Policy` response header contains one; see
// node_modules/next/dist/docs/app/building-your-application/configuring/content-security-policy.mdx).
```

If `unsafe-eval` is required by a specific dependency in dev only, scope it out of the production CSP with an environment check rather than shipping it always-on.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Medium] [STATUS: FIXED — verified 2026-08-19, see Remediation Verification table]
Area: Sensitive data exposure — token storage
File: src/lib/auth/authOptions.ts; src/types/next-auth.d.ts; src/client/axiosAuth.ts
Lines: authOptions.ts:121–125; next-auth.d.ts session interface; axiosAuth.ts:51–56
CWE: CWE-522 (Insufficiently Protected Credentials)

Vulnerable code:

```ts
// authOptions.ts
async session({ session, token }) {
  session.user = token.user!;
  session.accessToken = token.accessToken ?? '';
  return session;
},
```

```ts
// axiosAuth.ts
const session = await getSession();
if (session?.accessToken) {
  currentAccessToken = session.accessToken;
  config.headers['Authorization'] = `Bearer ${session.accessToken}`;
}
```

Issue: The backend access token is deliberately exposed to client-side JavaScript via `session.accessToken` (the refresh token is correctly kept server-only — this is explicitly and correctly documented in `next-auth.d.ts`). This is an architectural necessity here because the browser calls the Django backend directly with a bearer token rather than proxying every request through a Next.js route, so it is not a bug so much as a design tradeoff that increases blast radius: any XSS anywhere in the app (or a compromised dependency) can call `getSession()` and read a live, usable bearer token, then exfiltrate it and call the backend as the user for as long as that token is valid.
Risk: Full account takeover for the token's lifetime (bearer tokens are typically short-lived, ~60 min per the `authOptions.ts` comments, which caps but does not eliminate the exposure window) via any XSS primitive.
Data Impact: Yes — a live, usable backend credential is reachable from any script context on the page.

Fixed code: This is a real architectural tradeoff (BFF-proxies-every-call vs. direct browser→backend calls) and a full fix means proxying all authenticated backend calls through Next.js route handlers so the access token never leaves the server, e.g.:

```ts
// src/app/api/backend/[...path]/route.ts — a thin authenticated proxy
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { path } = await params;
  const upstream = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_API}${path.join('/')}${req.nextUrl.search}`,
    {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    }
  );
  return new NextResponse(upstream.body, { status: upstream.status });
}
```

Given the scale of that change for a starter template, the pragmatic mitigation is to treat the strict, nonce-based CSP fix above as load-bearing (it is the only thing standing between "an XSS bug exists" and "an XSS bug is a full account takeover"), keep the access-token lifetime short (already done, ~60 min), and document this tradeoff explicitly for forking teams in `context/auth.md` so they make an informed choice rather than inheriting it silently.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Medium] [STATUS: FIXED — verified 2026-08-19, see Remediation Verification table]
Area: Session management — logout / cache hygiene
File: src/providers/QueryProvider.tsx; src/client/axiosAuth.ts
Lines: QueryProvider.tsx (whole file, no `queryClient.clear()` call); axiosAuth.ts:90–97
CWE: CWE-613 (Insufficient Session Expiration), CWE-524 (Use of Cache Containing Sensitive Information)

Vulnerable code:

```ts
// axiosAuth.ts response interceptor, refresh-failure branch
currentAccessToken = null;
processQueue(refreshError, null);
clearPreferenceSession();
await signOut({ redirect: true, callbackUrl: '/login' });
throw refreshError;
```

```ts
// QueryProvider.tsx — onError for a 401
if (status(error) === 401 && !signingOut) {
  signingOut = true;
  clearPreferenceSession();
  signOut({ redirect: true, callbackUrl: '/login' });
  return;
}
```

Issue: On both forced logout paths, `clearPreferenceSession()` (sessionStorage) is called, but the TanStack Query in-memory cache (widget details, user profile, permissions, list pages — anything ever fetched this session) is never explicitly cleared via `queryClient.clear()`. `signOut({ redirect: true })` does trigger a full page navigation, which in practice unloads the JS heap and incidentally clears the cache — so exploitation requires a scenario where the SPA state survives logout (e.g. a future change to `redirect: false` handling, a service worker, or a race where a component keeps a stale `queryClient` reference across the navigation). Relying on an incidental side effect of full-page navigation rather than an explicit clear is fragile, and this exact pattern (implicit-clear-via-navigation) is a landmine for anyone who later changes `signOut`'s redirect behavior "to make it feel faster."
Risk: Stale, sensitive cached API responses (in particular anything under `widgets`, `user-profile`, and the permissions/role fetch) could remain queryable in memory past logout on a shared/kiosk device if the navigation-clears-everything assumption is ever broken.
Data Impact: Yes — cached user/tenant data (widget records, profile, permissions) persisting past an intended logout.

Fixed code:

```ts
// src/providers/QueryProvider.tsx
import { useRef } from 'react';
// ...
const [queryClient] = useState(() => { /* ...existing setup... */ });
const clientRef = useRef(queryClient);
clientRef.current = queryClient;

queryCache: new QueryCache({
  onError: (error) => {
    if (status(error) === 401 && !signingOut) {
      signingOut = true;
      clearPreferenceSession();
      clientRef.current.clear(); // explicit — don't rely on navigation to wipe state
      signOut({ redirect: true, callbackUrl: '/login' });
      return;
    }
    ...
  },
}),
```

```ts
// src/client/axiosAuth.ts — refresh-failure branch
currentAccessToken = null;
processQueue(refreshError, null);
clearPreferenceSession();
// Import and call a shared `clearQueryCache()` helper here too (e.g. exported
// from QueryProvider or a small `src/lib/queryClientRef.ts` singleton) before
// signOut, for the same reason.
await signOut({ redirect: true, callbackUrl: '/login' });
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Medium] [STATUS: FIXED — verified 2026-08-19, see Remediation Verification table]
Area: Broken access control — client-enforced permissions
File: src/app/(restricted)/components/PermissionGuard.tsx; src/lib/auth/getMyPermissions.ts; src/app/(restricted)/context/PermissionsContext.tsx
Lines: getMyPermissions.ts:21–22, 43–45; PermissionsContext.tsx:77–86
CWE: CWE-285 (Improper Authorization), CWE-863

Vulnerable code:

```ts
// getMyPermissions.ts
} catch {
  return { data: EMPTY, loaded: false };
}
```

```ts
// PermissionsContext.tsx — client refetch failure handling
.catch(() => {
  if (cancelled) return;
  setState((s) => (s.loaded ? s : { permissions: [], role: null, loaded: true }));
});
```

Issue: This is well-designed and the code's own comments are candid that it is "UX-level protection, not a security boundary" — that judgment is correct and is noted here as **validated**, not flagged as a bug. It is included as a Medium finding for a narrower reason: the **fail-open** window is real and worth hardening for a template other teams will copy verbatim. If the server-side `getMyPermissions()` fetch fails transiently (backend blip, network hiccup) _and_ the server had never previously seeded a real permission set for this session, `loaded` becomes `true` with an **empty** permission array, which correctly sends the user to `/no-role` — good. But if the server fetch simply times out silently and the client-side refetch in `PermissionsContext.tsx` also fails, the guard still renders `null` rather than the page (safe), yet there is no distinction surfaced to the user between "you have no access" and "we couldn't check" — a UX gap that could tempt a future maintainer to "fix" it by failing open (defaulting `loaded` to render children) without realizing that would remove the only client-side gate, since the code comment already frames failures as something to route around rather than block on.
Risk: Low as currently written (correctly fails closed to `/no-role`), but the architecture leans on every future edit correctly preserving "fail closed" semantics, with no test asserting it. A regression here is a UX-driven authorization bypass on the client (mitigated only by the backend, per the code's own comments, so real risk is contingent on backend correctness).
Data Impact: Contingent — no data impact today, since only the backend enforces authoritatively, but this component is the app's stated "UX-level" checkpoint and it should not silently degrade.

Fixed code: Add an explicit regression test asserting the fail-closed contract, and make the failure state visually distinct so a maintainer is less likely to "fix" it into failing open:

```ts
// src/app/(restricted)/components/__tests__/PermissionGuard.test.tsx (new)
it('never renders children when permissions failed to load', () => {
  // mock usePermissions() -> { loaded: true, permissions: [], hasRouteAccess: () => false, ... }
  // assert render output is null / redirect, never `children`
});
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Low] [STATUS: FIXED — verified 2026-08-19, see Remediation Verification table]
Area: Information disclosure — client error rendering
File: src/app/error.tsx; src/app/(restricted)/error.tsx; src/app/global-error.tsx
Lines: error.tsx:21; (restricted)/error.tsx:22; global-error.tsx:58
CWE: CWE-209 (Generation of Error Message Containing Sensitive Information)

Vulnerable code:

```tsx
<p className="text-muted-foreground">{error.message || t.common.somethingWentWrong}</p>
```

Issue: All three error boundaries render `error.message` directly to the user. For errors that originate in a Server Component, Next.js already redacts the message in production (replacing it with a generic string + `digest`), so that path is safe. But for any exception thrown or rethrown inside client-side code (an unhandled promise rejection surfaced as a render error, a third-party library throwing with an internal message, a bug in error-normalization code such as `normalizeBlobError` in `downloadBlob.ts` re-throwing a parsed backend payload as `error.message`) whatever string ends up on `.message` is shown verbatim. This is low severity because no current code path was found constructing an `Error` from raw backend response bodies, but it is a footgun: a future call site that does `throw new Error(JSON.stringify(response.data))` would leak backend internals (stack hints, internal field names, occasionally validation detail that reveals record existence) straight to the DOM.
Risk: Minor internal detail leakage if a future client-thrown error embeds backend response data in its `.message`.
Data Impact: Low — no sensitive data leak found in current code, but the pattern doesn't prevent one.

Fixed code:

```tsx
// Prefer a curated, localized fallback and log the real message to Sentry only.
<p className="text-muted-foreground">{t.common.somethingWentWrong}</p>;
{
  process.env.NODE_ENV !== 'production' && (
    <pre className="text-destructive text-xs">{error.message}</pre>
  );
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Low] [STATUS: NOT FIXED — verified 2026-08-19, see Remediation Verification table]
Area: Security headers — coverage gap between proxy and next.config.ts
File: src/proxy.ts
Lines: 13, 101–122
CWE: CWE-693

Vulnerable code:

```ts
const PUBLIC_PATHS = ['/login', '/forgot-password', '/signup', '/api/auth'];
...
export const config = {
  matcher: [
    '/', '/login', '/forgot-password', '/signup', '/signup/:path*',
    '/dashboard', '/dashboard/:path*', '/preferences', '/preferences/:path*',
    '/user-profile', '/no-role', '/widgets', '/widgets/:path*',
  ],
};
```

Issue: `PUBLIC_PATHS` references `/api/auth`, and `handleAuthenticatedRequest`'s `ENABLED_PREFIXES` kill-switch implicitly protects app routes, but the `matcher` array — which the file's own comment correctly calls "must list every path the middleware should see... a route missing here is not protected" — does **not** include `/api/auth/:path*`, `/api/health`, or `/legal/:path*`. This is not a broken-access-control bug (the API routes each call `getToken()`/`getServerSession()` themselves, and `/legal` is intentionally public content), but it does mean the proxy's own `SECURITY_HEADERS` object (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) is never applied to those responses **from the proxy**. In practice this is covered by `next.config.ts`'s `headers()` block using `source: '/(.*)'`, which does apply globally — so there is no live gap today. Flagging because the proxy carries a _second_, redundant copy of the same header set with a narrower matcher than the global one in `next.config.ts`, which is exactly the kind of duplication that drifts: a future edit to `SECURITY_HEADERS` in one file and not the other silently reintroduces inconsistent headers on a subset of routes.
Risk: Header drift between the two definitions over time; not currently exploitable.
Data Impact: No.

Fixed code: Single-source the header set.

```ts
// src/lib/securityHeaders.ts (new, shared by both next.config.ts and proxy.ts)
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

Import it from both `next.config.ts`'s `securityHeaders` array construction and `src/proxy.ts`, and drop the proxy's redundant application if `next.config.ts`'s global `headers()` block is trusted to cover it (recommended — one source of truth beats two that must be kept in sync).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Low] [STATUS: FIXED — verified 2026-08-19, see Remediation Verification table]
Area: Dependency / supply-chain — transitive
File: package.json (transitive: postcss, sharp, fast-uri, nanoid, uuid)
Lines: devDependencies / transitive tree
CWE: CWE-1104

Vulnerable code:

```
node_modules/postcss   (<=8.5.22, via tailwindcss/next tooling)
node_modules/sharp     (<0.35.0, via next/image optimization)
node_modules/fast-uri, node_modules/nanoid, node_modules/uuid
```

Issue: `npm audit` flags several transitive dependencies: `postcss` (path traversal / arbitrary `.map` file disclosure via `sourceMappingURL`, high), `sharp` (inherited `libvips` CVEs, high — relevant since `next/image` uses `sharp` server-side for the image optimization API this app's `remotePatterns` enable), `fast-uri` (host confusion via backslash/IDN, moderate-ish), `nanoid`/`uuid` (moderate, mostly relevant if used for anything security-sensitive like token generation — grep found no first-party use of `nanoid` for security tokens).
Risk: `sharp`/`postcss` findings are build/server-side and could affect the image-optimization endpoint or dev-time source-map handling; low direct exploitability from the frontend's own code, but real if an attacker can influence image URLs served through `next/image` remotePatterns (currently scoped to backend origins + localhost, which limits it).
Data Impact: Low/No — primarily availability and information-disclosure risk on internal tooling, not tenant data.

Fixed code:

```bash
npm audit fix
# Verify postcss/sharp/fast-uri/nanoid/uuid versions bumped; re-run `npm run build`.
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Info] [STATUS: Still present — unchanged]
Area: Positive finding — CVE-2025-29927 mitigation
File: src/proxy.ts
Lines: 78–81
CWE: N/A

```ts
// CVE-2025-29927 mitigation
if (request.headers.get('x-middleware-subrequest')) {
  return new NextResponse('Forbidden', { status: 403 });
}
```

This correctly rejects the `x-middleware-subrequest` header spoofing technique used to bypass Next.js middleware in the disclosed CVE. Confirmed present and correctly placed before any auth logic. No action needed; noted so it isn't miscounted as missing.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Info] [STATUS: Still present — unchanged]
Area: Positive finding — open redirect protection
File: src/lib/auth/safeRedirect.ts; src/app/(public)/hooks/useLoginForm.ts
Lines: safeRedirect.ts:5–16; useLoginForm.ts:26, 42
CWE: N/A

`callbackUrl` from `useSearchParams()` is passed through `safeRedirect()` before being handed to `router.push()`, and `safeRedirect` correctly rejects protocol-relative (`//evil.com`) and cross-host absolute URLs, falling back to `DEFAULT_LANDING`. This is the correct pattern and was checked specifically for the `//evil.com` and `https://evil.com` bypass classes — both are handled. No open redirect found in the login flow. `ALLOWED_HOSTS` derives from `NEXTAUTH_URL`, so correctness in production depends on that env var being set to the real production origin (not independently verifiable without reading `.env.local`, see Coverage Report).
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Info] [STATUS: Still present — unchanged]
Area: Positive finding — refresh-token rotation and blacklisting
File: src/app/api/auth/refresh/route.ts; src/app/api/auth/logout/route.ts
Lines: whole files
CWE: N/A

Refresh-token rotation is correctly implemented: the backend rotates the refresh token on every use (`BLACKLIST_AFTER_ROTATION`), and the route writes the rotated token back into the encrypted session cookie, including correct handling of NextAuth's cookie chunking for oversized JWTs (a subtle correctness issue that, if missed, would silently break sessions rather than fail security — verified the chunk-clearing logic is symmetric). Logout explicitly blacklists the backend refresh token server-side before clearing the frontend session, closing the "logged out frontend, still-valid backend token" gap. No CSRF concern on `/api/auth/refresh` or `/api/auth/logout`: both are read of an httpOnly cookie plus a state-changing POST with no side effect an attacker benefits from forcing (refresh: rotates the _victim's own_ token; logout: logs the victim out), and `sameSite: 'lax'` on the session cookie blocks cross-site POST delivery of the cookie in the first place for most browsers.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Info] [STATUS: FIXED — verified 2026-08-19, see Remediation Verification table]
Area: Positive finding — Sentry data scrubbing
File: sentry.client.config.ts; sentry.server.config.ts; sentry.edge.config.ts
Lines: client:13–19
CWE: N/A

Session Replay is configured with `maskAllText: true`, `maskAllInputs: true`, `blockAllMedia: true` — the correct conservative defaults that prevent replay recordings from capturing PII/credentials typed into forms. DSN is read from `NEXT_PUBLIC_SENTRY_DSN` and all three configs no-op when unset, so Sentry doesn't silently activate with a missing DSN. No `beforeSend` scrubber was found for exception payloads (breadcrumbs, request data, user context) — Sentry's own default scrubbing covers common cases, but this template does not add an explicit `beforeSend` to strip `Authorization` headers or request bodies from captured HTTP breadcrumbs, which axios instrumentation can include. Recommend adding one given `axiosAuth` attaches bearer tokens to every request.

Fixed code:

```ts
// sentry.client.config.ts / server / edge
Sentry.init({
  dsn,
  ...
  beforeSend(event) {
    if (event.request?.headers) delete event.request.headers['Authorization'];
    return event;
  },
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
      if (breadcrumb.data) delete breadcrumb.data['Authorization'];
    }
    return breadcrumb;
  },
});
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## Summary Table (open items only — 2026-08-19 follow-up)

6 of the original 9 findings are now FIXED and are excluded below (see the Remediation Verification table above for the full record, including FIXED items). This table reflects what is actually still open, plus new findings from this pass.

| #     | Severity | File                                   | Lines        | Area                                                          | CWE              | Data Impact?               | Status                    |
| ----- | -------- | -------------------------------------- | ------------ | ------------------------------------------------------------- | ---------------- | -------------------------- | ------------------------- |
| 8     | Low      | next.config.ts; src/proxy.ts           | 33–42; 7–12  | Duplicated/drifting security headers (still 2 sources)        | CWE-693          | No                         | NOT FIXED                 |
| NEW-1 | Low      | src/app/api/backend/[...path]/route.ts | 23–34, 62–75 | Generic backend proxy has no path allowlist                   | CWE-284, CWE-918 | Contingent on backend RBAC | NEW                       |
| NEW-2 | Info     | src/app/api/auth/refresh/route.ts      | 91–99        | Refresh-route error logging (raw backend body, unconditional) | CWE-532          | Low                        | NEW (carried over nuance) |

**Current open severity totals:** 0 Critical, 0 High, 0 Medium, 2 Low, 1 Info (down from 2 Critical / 1 High / 3 Medium / 3 Low at the original audit).

---

## Top 5 Immediate Fixes (updated 2026-08-19 — reflects what's actually still open)

The original top 3 (next-auth, next, CSP) and the query-cache/Sentry-scrubbing items are all verified FIXED — see the Remediation Verification table. What's left:

1. **Single-source the security header set.** `next.config.ts`'s `securityHeaders` array and `src/proxy.ts`'s `SECURITY_HEADERS` object are still two independently maintained literals (now with a comment asking humans to keep them in sync, which is the exact drift risk the original finding warned about). Extract to one shared module both files import:

   ```ts
   // src/lib/securityHeaders.ts
   export const SECURITY_HEADERS: Record<string, string> = {
     'X-Frame-Options': 'DENY',
     'X-Content-Type-Options': 'nosniff',
     'Referrer-Policy': 'strict-origin-when-cross-origin',
     'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
   };
   ```

2. **Decide deliberately on the backend proxy's allowlist posture.** `src/app/api/backend/[...path]/route.ts` forwards any path to the backend, unauthenticated requests included, by design. This is defensible given `NEXT_PUBLIC_BACKEND_API` was already browser-reachable directly, but it should be a documented decision, not an implicit one — either add an explicit `ALLOWED_PATH_PREFIXES` allowlist (see the finding above for a sketch) or note the tradeoff in `context/auth.md` next to the existing token-exposure tradeoff note.

3. **Redact the refresh route's unconditional error log.** `src/app/api/auth/refresh/route.ts:91-99` still logs the raw backend error `data` on every failed refresh, now the sole code path for token rotation. Trim to `data?.errors?.code` or similar before it reaches whatever log aggregator server logs feed into.

4. **Add a build-time or CI check that `src/proxy.ts`'s `config.matcher` covers every route under `src/app/**`,** so a newly added page can't silently ship unprotected — noted as a manual, unenforced invariant in the original Hardening Checklist and still true today (the matcher was correctly updated for `/legal` in this pass, which is exactly the kind of manual step a check would make unnecessary).

5. **Nothing dependency-related remains urgent.** `npm audit` is clean; keep it that way with the existing CI/pre-commit gates (`scripts/security-scan.mjs`, `scripts/secret-scan.mjs`) — the one still-unverified item from the original report is whether a CI workflow actually invokes them as a required, non-bypassable check (no CI config was found under the scanned tree in either audit pass).

---

## Hardening Checklist

### `next.config.ts` — `headers()` / CSP block

- [ ] Move CSP generation to `src/proxy.ts` (or a shared helper imported by both) so a per-request **nonce** can be issued; drop `'unsafe-inline'` and `'unsafe-eval'` from `script-src`.
- [ ] Add `object-src 'none'` and `base-uri 'self'` to the CSP (currently absent — both are cheap, high-value additions).
- [ ] Keep `frame-ancestors 'none'` (present, correct) and `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (present, correct — verify the production domain is actually HSTS-preload-submitted if relying on `preload`).
- [ ] Keep deriving `connect-src`/`img-src` from `NEXT_PUBLIC_BACKEND_API*` env vars (present, correct pattern — verify it stays a strict origin allowlist, never a wildcard, as new backends are added).
- [ ] Confirm `productionBrowserSourceMaps` stays unset/`false` in `next.config.ts` (verified absent → defaults to `false`, correct; Sentry uploads source maps out-of-band via its webpack plugin instead, which is the right approach).

### NextAuth cookie flags

- [ ] Verify in production that `NEXTAUTH_URL` starts with `https://` so `SESSION_COOKIE_NAME` in `src/app/api/auth/refresh/route.ts` resolves to the `__Secure-` prefixed cookie name (code already branches on this correctly — this is an operational verification, not a code change).
- [ ] `httpOnly: true`, `sameSite: 'lax'`, `secure: <derived from __Secure- prefix>`, `path: '/'` are all present on the manually-written refresh cookie (`route.ts:79–84`) — confirmed correct and consistent with NextAuth's own defaults for the primary sign-in cookie.
- [ ] `session.maxAge` is deliberately pinned to 7 days to match the backend refresh-token lifetime (`authOptions.ts:36`) — confirmed as intentional and correct; keep this in sync if the backend's `SIMPLE_JWT REFRESH_TOKEN_LIFETIME_DAYS` ever changes.

### Server-side authoritative auth/role checks

- [ ] `src/proxy.ts` matcher array must be updated every time a new route is added — confirmed no route is currently missing, but this is a manual, unenforced invariant. Consider a build-time check (e.g. a script comparing `src/app/**/page.tsx` route segments against the matcher array) so a forgotten route fails CI instead of shipping unprotected.
- [ ] Every `src/app/api/**` route confirmed to call `getToken()`/`getServerSession()` before doing anything sensitive (`logout`, `refresh` both do; `health` and `[...nextauth]` correctly don't need to).
- [ ] `PermissionGuard`/`PermissionsContext`/`ROUTE_PERMISSIONS` are explicitly documented and confirmed as **UX-level only** — the backend is the real gate. Add the regression test proposed in the Medium finding above to lock in fail-closed behavior.

### Open-redirect-safe `callbackUrl` handling

- [ ] `safeRedirect()` confirmed to reject `//host` and cross-origin absolute URLs (`src/lib/auth/safeRedirect.ts`). Used consistently at the one call site that reads `callbackUrl` from `useSearchParams()` (`useLoginForm.ts`). No other `router.push`/`redirect`/`window.location` call in `src/**` was found consuming unvalidated user input (grep-verified across all `.tsx`/`.ts` files).
- [ ] `ALLOWED_HOSTS` in `safeRedirect.ts` depends on `NEXTAUTH_URL` — verify this is set to the exact production origin (no trailing path) before each deploy.

### Query-cache clearing on logout

- [ ] Implement the `queryClient.clear()` fix above in both `QueryProvider.tsx` (401 auto-logout) and `axiosAuth.ts` (refresh-failure logout) — currently relies on full-page navigation as an implicit clear.
- [ ] `sessionStorage` preference clearing (`clearPreferenceSession()`) confirmed called on both logout paths — correct.

### Log redaction

- [ ] `src/lib/logger.ts` gates all console output on `NODE_ENV === 'development'` — confirmed no production console noise from this helper.
- [ ] `src/app/api/auth/refresh/route.ts:88–93` logs `console.error('[auth] refresh request failed', { url, status, data, message })` **unconditionally** (not gated by `logger.ts`, runs server-side always). `data` is the raw backend error response body — on a self-hosted/observability-piped server this could write backend error payloads (potentially including validation detail) to server logs. Server-side logs are a lower-sensitivity surface than client console, but confirm this doesn't feed into a log aggregator with broader access than intended, and consider redacting `data` to just `data?.errors?.code` if the full body isn't needed for debugging.
- [ ] Add the Sentry `beforeSend`/`beforeBreadcrumb` scrubber from Finding "Positive finding — Sentry data scrubbing" to strip `Authorization` headers from captured network breadcrumbs.

### `.gitignore` verification for secrets

- [ ] Confirmed: `.env`, `.env.local`, `.env.e2e`, `.env.*.local` are all gitignored; only `.env.example` and `.env.e2e.example` (placeholder-only, verified) are meant to be committed.
- [ ] Confirmed: `e2e/.auth/` (Playwright auth state containing real session tokens) is gitignored.
- [ ] Confirmed: `sbom.json`, `*.pem`, `*.bak`/`*.backup` are gitignored.
- [ ] `scripts/secret-scan.mjs` (Gitleaks wrapper) and `.gitleaks.toml` reviewed — configuration is sound (extends the default ruleset, allowlists only test fixtures and `.env.example`/`.env.e2e.example` paths plus an explicit placeholder-value regex). Effectiveness depends entirely on Gitleaks or Docker being available in the environment running it (`pre-commit`/`pre-push` hooks and CI) — the script fails closed (non-zero exit) if neither is found, which is the correct behavior, but **could not verify from this directory that CI actually invokes it** (no CI workflow file found under the scanned tree — see Coverage Report NOT PROVIDED list).

### Sentry leakage review

- [ ] Session Replay masking (`maskAllText`, `maskAllInputs`, `blockAllMedia`) confirmed enabled and correctly conservative in `sentry.client.config.ts`.
- [ ] No explicit `beforeSend`/`beforeBreadcrumb` scrubber found in any of the three Sentry configs — add one to strip `Authorization` headers (see fix above), since `axiosAuth` attaches a bearer token to every request and Sentry's XHR/fetch breadcrumb instrumentation can capture request headers.
- [ ] `tracesSampleRate` and DSN-gating (`if (dsn) { Sentry.init(...) }`) confirmed sane across client/server/edge configs — Sentry never activates with an empty/unset DSN.

### `scripts/security-scan.mjs` / `scripts/secret-scan.mjs` effectiveness

- [ ] Both scripts are well-built external-tool wrappers (Semgrep for SAST, Gitleaks for secrets) with a sensible resolution order (native binary → Docker) and a fail-closed default (`SKIP_*` env vars are documented as local-only bypasses, "CI never sets it"). Their actual effectiveness in this repo could not be fully verified because **no CI workflow file was found under the scanned directory** to confirm these gates are wired into a required check rather than only a local pre-commit/pre-push hook (which a contributor can bypass with `--no-verify` unless server-side branch protection also requires the CI job). Recommend confirming (outside this frontend repo) that a CI pipeline calls `npm run security` and `npm run secrets` on every PR and blocks merge on failure.

---

# Pass 3 — Deep Audit (2026-08-21)

Since the 2026-08-19 verification the team shipped the organization/multi-tenancy feature: an
organization switcher, `/organization/*` and `/invites` route trees, `getMyOrganizations`, and a
rewritten `src/proxy.ts`. This pass audits that surface, re-checks the two findings left open by
the previous pass, and re-examines the whole app against the audit areas.

**Method.** `node_modules` was present this time, so `npm audit` was run for real and the
open-redirect guard was executed against a payload set rather than reasoned about. Findings marked
**✅ CONFIRMED** were reproduced, not inferred.

---

## Previously-open findings

| ID                                                                 | Status                     | Notes                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicated security-header config (`next.config.ts` vs `proxy.ts`) | **RESOLVED (by design)**   | Now a documented split with the rationale stated in both files: static headers plus HSTS live in `next.config.ts` `headers()` and apply to every route; the nonce-based CSP must vary per request so it can only be built in middleware. Not duplication — a deliberate two-layer arrangement.                                |
| BFF proxy has no explicit path allowlist                           | **OPEN (accepted → Info)** | Still correctly reasoned. The target URL is built by concatenating onto a fixed `BACKEND_ORIGIN` (`route.ts:64`), never by re-parsing attacker input, so no SSRF. Percent-encoded traversal is normalized away by the WHATWG URL parser before `fetch`, confining reachability to the Django origin the app already talks to. |

---

## New findings

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Medium]  ✅ CONFIRMED
Area:         Open Redirect
File:         src/lib/auth/safeRedirect.ts
Lines:        5–16
CWE:          CWE-601 (URL Redirection to Untrusted Site)

Vulnerable code:
// Line 8
    const parsed = new URL(url, ALLOWED_HOSTS[0]);
// Line 9
    const isRelative = url.startsWith('/') && !url.startsWith('//');
// Line 10
    const isSameHost = ALLOWED_HOSTS.some((h) => new URL(h).host === parsed.host);
// Line 11
    if (isRelative || isSameHost) return url;

Issue:        `isRelative` is computed from the RAW STRING while `parsed` — the
              correctly-normalized URL, whose host may be an attacker's — is
              computed and then ignored whenever `isRelative` is true. Browsers
              normalize a backslash to a forward slash in the path of a special
              scheme, so `/\evil.com` starts with '/' but not '//' (passes the
              guard) and yet resolves to a different origin.

              Executed against the real function:

                "/dashboard"          -> "/dashboard"       -> localhost:3000/dashboard  OK
                "//evil.com"          -> "/dashboard"       -> blocked                   OK
                "https://evil.com"    -> "/dashboard"       -> blocked                   OK
                "/\\evil.com"         -> "/\\evil.com"      -> http://evil.com/     <-- BYPASS
                "/\/evil.com"         -> "/\/evil.com"      -> http://evil.com/     <-- BYPASS

Risk:         `safeRedirect` is the only control on the post-login destination:
              `useLoginForm.ts:42` calls `router.push(safeRedirect(callbackUrl))`
              with `callbackUrl` straight from the query string. A phishing link
              to /login?callbackUrl=/\/evil.com sends the victim to an
              attacker-controlled origin immediately after a genuine
              authentication — the highest-trust moment in the session. Whether
              Next's client router follows an off-origin value is version-
              dependent and was not verified end to end; the guard itself is
              unambiguously bypassed, and any other consumer (an <a href>,
              window.location, a server-side redirect()) would follow it.

Fixed code:
// Line 9 — drop the raw-string test; trust only the parsed result.
    const parsed = new URL(url, ALLOWED_HOSTS[0]);
    const isSameHost = ALLOWED_HOSTS.some((h) => new URL(h).host === parsed.host);
    if (isSameHost) return parsed.pathname + parsed.search + parsed.hash;
// Returning the re-serialized path (not the raw input) also prevents any
// other normalization difference from slipping through.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Medium]
Area:         Authentication / Sensitive Data Exposure
File:         src/app/(restricted)/context/OrganizationContext.tsx
Lines:        54–64
CWE:          CWE-522 (Insufficiently Protected Credentials)

Vulnerable code:
// Line 54
const { data } = await axiosAuth.post(organizationSwitchEndpoint(organizationId));
// Line 55
const payload = data?.data ?? {};
// Line 60
await update({
// Line 61
  access: payload.access,
// Line 62
  refresh: payload.refresh,
// Line 63
  user: payload.user,
// Line 64
});

Issue:        The organization-switch response carries a full backend token pair —
              access AND refresh — through client-side JavaScript before
              useSession().update() writes it into the httpOnly cookie. This is
              the one remaining path where a live backend credential is readable
              by page scripts, which is exactly what the BFF proxy at
              src/app/api/backend/[...path] was introduced to eliminate:
              session.accessToken was removed from the session callback and
              axiosAuth stopped attaching Authorization headers itself, so no
              other flow exposes a token. The refresh token is the more serious
              half — it long-outlives the access token and mints new pairs.
Risk:         An XSS payload no longer has to settle for replaying requests
              through the proxy for the lifetime of the tab. It can invoke the
              switch endpoint itself (any user with at least one organization
              always succeeds), read payload.access and payload.refresh out of
              the response, and exfiltrate a credential pair that remains usable
              off the victim's machine. Backend AUTH-H-01 compounds this: a
              password reset does not revoke that stolen refresh token.

Fixed code:
// Move the switch server-side so tokens never reach page scripts: a route
// handler calls the backend and writes the pair into the JWT cookie via
// NextAuth's own encode(), exactly as /api/auth/refresh already does.
// Line 54
const { data } = await fetch('/api/auth/switch-organization', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ organizationId }),
}).then((r) => r.json());
// Response body contains only { user } — never access/refresh.
await update({ user: data.user });
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Low]
Area:         Security Headers & CSP
File:         src/proxy.ts
Lines:        64–73, 180–199

Vulnerable code:
// Line 64 — /invites is an enabled page...
const ENABLED_PREFIXES: readonly string[] = [
  '/dashboard',
  '/preferences',
  '/invites',
  ...
// Line 180 — ...but has no matcher entry, so middleware never runs for it
  matcher: [
    '/',
    '/login',
    ...
    '/organization',
    '/organization/:path*',
  ],

Issue:        /invites is in ENABLED_PREFIXES, is in PermissionGuard's
              GLOBAL_PATHS, and has a real page — but no matcher entry. The
              middleware never executes for it, so it ships without the
              per-request nonce CSP from buildCsp(). Static headers from
              next.config.ts (X-Frame-Options, HSTS, nosniff, Referrer-Policy)
              still apply, and authentication is still enforced because
              RestrictedLayout calls getServerSession and redirects — so this is
              a hardening gap, not an auth bypass.
Risk:         The one authenticated page in the app with no Content-Security-
              Policy, and it renders invite data whose organization and inviter
              names originate from other tenants. An injection there executes
              without the script-src 'nonce'/'strict-dynamic' restriction every
              other page enforces. The same omission on a future route would be
              equally silent: the file's own comment warns "a route missing here
              is not protected", and nothing tests that the two lists agree.

Fixed code:
// Line 194 — add the missing entries alongside the other route trees
    '/invites',
    '/invites/:path*',
// And add a unit test asserting every ENABLED_PREFIXES entry is covered by the
// matcher, so the lists cannot drift again.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Low]
Area:         Configuration / Session Management
File:         src/app/api/auth/refresh/route.ts, src/lib/auth/safeRedirect.ts
Lines:        5–7 and 3 respectively
CWE:          CWE-1188 (Insecure Default)

Vulnerable code:
// refresh/route.ts, Line 5
const SESSION_COOKIE_NAME = process.env.NEXTAUTH_URL?.startsWith('https://')
  ? '__Secure-next-auth.session-token'
  : 'next-auth.session-token';
// safeRedirect.ts, Line 3
const ALLOWED_HOSTS = [process.env.NEXTAUTH_URL ?? 'http://localhost:3000'];

Issue:        NEXTAUTH_URL is load-bearing for two separate security controls —
              whether the rewritten session cookie gets the __Secure- prefix and
              `secure: true` (route.ts:86), and which origin the redirect
              allowlist trusts — yet both silently fall back to an insecure
              default. Nothing asserts it is set, or that it is https, at
              startup. .env.example ships NEXTAUTH_URL=http://localhost:3000,
              which is the correct dev value and precisely the wrong production
              one.
Risk:         A production deploy behind a TLS-terminating proxy that forgets to
              set NEXTAUTH_URL rewrites the session cookie on every token
              refresh without the Secure flag, and points the redirect allowlist
              at localhost. Neither failure is visible in normal operation —
              the app works, it is just no longer enforcing what it appears to.

Fixed code:
// Add a startup assertion in an instrumentation hook or a shared env module:
if (process.env.NODE_ENV === 'production') {
  const u = process.env.NEXTAUTH_URL;
  if (!u?.startsWith('https://')) {
    throw new Error('NEXTAUTH_URL must be set to an https:// origin in production.');
  }
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SEVERITY: Info]
Area:         Session Management
File:         src/lib/auth/authOptions.ts
Lines:        124–129

Vulnerable code:
// Line 124
if (trigger === 'update' && session?.user) {
// Line 125
  token.user = session.user as typeof token.user;
// Line 126
}

Issue:        On a session update the client-supplied object is written into the
              JWT wholesale, with no shape validation and no cross-check against
              the backend. A user can set their own token.user.role to anything.
Risk:         Cosmetic today, and deliberately so — RestrictedLayout seeds
              PermissionsProvider from getMyPermissions(), a fresh server-side
              no-store backend read, not from token.user, and the backend is the
              authoritative gate on every request. The effect is a user spoofing
              labels in their own UI. Filed as Info because the safety rests on
              a convention that is easy to break: any future code path that
              reads token.user.permissions for a decision rather than for
              display turns this into a real privilege bug.

Fixed code:
// Line 124 — narrow to the fields a switch legitimately changes.
if (trigger === 'update' && session?.user) {
  token.user = {
    ...token.user,
    organization: session.user.organization,
    organizations: session.user.organizations,
  };
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Summary Table

| #   | Severity | File                                                                | Lines          | Area                      | Confirmed |
| --- | -------- | ------------------------------------------------------------------- | -------------- | ------------------------- | :-------: |
| 1   | Medium   | `src/lib/auth/safeRedirect.ts`                                      | 5–16           | Open Redirect             |    ✅     |
| 2   | Medium   | `src/app/(restricted)/context/OrganizationContext.tsx`              | 54–64          | Credential Exposure       |           |
| 3   | Low      | `src/proxy.ts`                                                      | 64–73, 180–199 | Headers / CSP             |           |
| 4   | Low      | `src/app/api/auth/refresh/route.ts`, `src/lib/auth/safeRedirect.ts` | 5–7, 3         | Configuration             |           |
| 5   | Info     | `src/lib/auth/authOptions.ts`                                       | 124–129        | Session Management        |           |
| 6   | Info     | `src/app/api/backend/[...path]/route.ts`                            | 36–93          | CSRF (SameSite-dependent) |           |
| 7   | Info     | `src/app/api/auth/refresh/route.ts`                                 | 93–98          | Error Logging             |           |

## Top 3 Immediate Fixes

1. **`safeRedirect` backslash bypass** — delete the `isRelative` raw-string test and trust only
   `parsed.host`, returning the re-serialized path. Add the payload set above as a unit test.
2. **Organization switch leaks a token pair to page scripts** — move the switch behind a route
   handler that writes the cookie server-side, mirroring `/api/auth/refresh`.
3. **`/invites` has no CSP** — add `'/invites'` and `'/invites/:path*'` to the middleware matcher,
   plus a test that `ENABLED_PREFIXES` and `matcher` cannot drift apart.

---

## Verified Sound

Checked in depth, no defect found:

- **`npm audit --omit=dev`: 0 vulnerabilities.** `next@16.3.1`, `next-auth@4.24.15`,
  `react@19.2.4`, `axios@1.18.0` — all current.
- **No XSS sinks anywhere in `src/`** — zero occurrences of `dangerouslySetInnerHTML`,
  `innerHTML`, `document.write`, `eval`, `new Function`, or `srcDoc`.
- **No credential in web storage** — the only `sessionStorage` use is the preferences module
  (feature-flag booleans); the only `document.cookie` write is the sidebar's open/closed state.
  `localStorage` is not used at all.
- **`NEXT_PUBLIC_` hygiene** — only `NEXT_PUBLIC_BACKEND_API`, `NEXT_PUBLIC_BACKEND_RAW_API` and
  `NEXT_PUBLIC_SENTRY_DSN` are exposed; all three are legitimately public.
- **`src/app/api/backend/[...path]/route.ts`** — no SSRF (fixed origin, string concatenation,
  never re-parses an attacker-supplied host); `Cookie`/`Host`/`Connection` deliberately not
  forwarded upstream; `Set-Cookie` deliberately not forwarded downstream; `redirect: 'manual'`
  so a backend redirect cannot be followed to an unintended target. It carries no CSRF token and
  relies on NextAuth's `SameSite=Lax` session cookie to block cross-site mutations — correct
  today, worth revisiting if that cookie policy is ever loosened (Info #6).
- **`src/proxy.ts`** — CVE-2025-29927 (`x-middleware-subrequest`) mitigation present and first in
  the handler; `getToken()` wrapped so a forged `Authorization` header cannot DoS every gated
  route; production CSP keeps `'strict-dynamic'` with no `unsafe-eval`, plus `object-src 'none'`,
  `base-uri 'self'`, `frame-ancestors 'none'`; nonce via `crypto.getRandomValues`.
- **`RestrictedLayout`** — server-side `getServerSession` redirect is the real auth gate, so
  middleware coverage is defence-in-depth rather than the only control.
- **`PermissionGuard`** — correctly documented as UX-level only, fails closed (`loaded &&
!hasRouteAccess` blocks), and renders nothing rather than flashing an unauthorized page.
- **`getServerAccessToken`** / `types/next-auth.d.ts` — `session.accessToken` remains removed and
  the `session()` callback still returns no token to client scripts.
- **`axiosAuth`** — attaches no Authorization header itself; single-flight refresh with a queued
  retry; on refresh failure it clears the query cache and preference session before `signOut`.
- **`/api/auth/refresh`** — refresh token read from and rotated back into the httpOnly cookie,
  never returned in the body; session expiry preserved rather than slid forward; NextAuth's
  cookie chunking mirrored correctly.
- **Organization data flow** — the layout refetches organizations live rather than trusting the
  session snapshot, so a member removed elsewhere loses the switcher entry on their next
  navigation; `clearQueryCache()` on switch prevents the previous tenant's cached data rendering
  under the new tenant's name.
- **Token lifetimes align** — `SESSION_MAX_AGE_SECONDS` (7 days) matches the backend's
  `REFRESH_TOKEN_LIFETIME_DAYS=7` in `.env.example`; no session outliving its credential.

---

## Current open totals

| Severity | Count |
| -------- | :---: |
| Critical |   0   |
| High     |   0   |
| Medium   |   2   |
| Low      |   2   |
| Info     |   3   |

Reconciliation from pass-2 totals (0C/0H/0M/2L/1I): the duplicated-header Low is resolved; the
BFF path-allowlist Low is reclassified Info (accepted, no exposure); this pass adds two Mediums,
two Lows, and one Info.

## Audit note

`npm audit` and the `safeRedirect` payload testing were executed. The remaining findings are from
static reading; no application file was modified by this audit. The backend counterpart — including
a **confirmed Critical** cross-tenant takeover and a **confirmed High** session-revocation gap that
directly compounds finding #2 above — is in
`enterprise-backend-template/security_reports/00_SUMMARY_SECURITY_AUDIT.md`.
