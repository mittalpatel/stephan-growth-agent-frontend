# Auth & RBAC

## Providers

Credentials only. `src/lib/auth/authOptions.ts` posts to the backend's login endpoint
and stores the returned `{access, refresh, user}` in the NextAuth JWT.

### Product MFA (TOTP): three real routes, not one page with hidden states

If the account has a confirmed authenticator device, the backend's login endpoint
returns `{mfa_required: true, mfa_challenge: "..."}` instead of tokens. This spans
**three separate pages**, each with its own URL — `/login`, `/login/otp`,
`/login/backup-code` — rather than one page toggling internal component state.
Reachability by reload/bookmark/back-button is the point: a step that only exists as
in-memory state has no URL to land on directly, which is exactly the failure mode a
page reload or a "back" tap hits.

- **`/login`** (`LoginForm.tsx` + `useLoginForm.ts`) — plain credentials. NextAuth's
  `credentials` provider has no built-in multi-step flow, so `authorize()`
  (`authOptions.ts`) handles the branch: on a normal password call, if the backend
  response carries `mfa_required`, it **throws** `MFA_REQUIRED::<challenge>` — the
  only channel `authorize()` has back to the client mid-flow, since a non-final call
  can't return a partial `User`. `useLoginForm.ts` catches that prefix, hands the
  challenge to `mfaChallengeStorage.ts` (`sessionStorage`, not a query param or
  `localStorage` — see that file's docstring for why), and does a real
  `router.push('/login/otp')`.
- **`/login/otp`** and **`/login/backup-code`** (`MfaVerifyForm.tsx` +
  `useMfaVerifyForm.ts`, shared) — the code-entry step. Both read the same stored
  challenge and submit through the same second `authorize()` branch
  (`mfaChallenge`/`mfaCode` present → calls `login/mfa/verify/`); they differ only in
  label/placeholder/keyboard (`inputMode`), and a link between them lets the user
  switch without losing the challenge. Landing on either with no stored challenge
  (direct navigation, a stale bookmark, storage cleared) redirects to `/login` rather
  than rendering a dead form — see `useHasStoredChallenge` in
  `useMfaVerifyForm.ts` for the hydration-safe read (`useSyncExternalStore`, not a
  `useEffect` + `setState`, to avoid a server/client mismatch on first render).
- **Wrong code vs. dead challenge are not the same outcome.** The backend's
  `errors.code` distinguishes `mfa_invalid_code` from `mfa_locked`/
  `mfa_challenge_invalid`; `authOptions.ts` threads that through as a
  `MFA_RETRY::`/`MFA_FATAL::` prefix. `useMfaVerifyForm.ts` only clears the stored
  challenge and redirects to `/login` for the fatal case — a wrong code shows an
  inline field error and lets the user try again on the same page, challenge intact.

Enrollment/disable/recovery-codes live under `/user-profile`'s "Two-Factor
Authentication" section (`src/hooks/useMfa.ts`,
`src/app/(restricted)/user-profile/components/Mfa*`), following the same
reveal-once discipline as the API-keys secret dialog: the QR/secret and recovery
codes exist only in that hook's in-memory state, never persisted client-side, because
the backend guarantees neither can be fetched a second time either.

No SSO provider ships with the template. The backend already models an
identity-provider account as `RegistrationType.EXTERNAL` and refuses every local
credential operation for one; adding a provider is documented as a seam in
`authOptions.ts`. The key rule there: exchange the provider's grant for **your own**
JWT pair on the backend, and put that in the session. A session carrying the
provider's tokens makes authorization depend on whatever claims the IdP sends.

## Token storage — and why it is split

| Token       | Lives                                                             | Reason                                                              |
| ----------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| Access      | httpOnly session cookie **only** — never in `session.accessToken` | Client JS never holds a usable backend credential at all; see below |
| Refresh     | httpOnly, chunked session cookie                                  | Unreadable from JS                                                  |
| Permissions | Fetched out-of-band, held in `PermissionsContext`                 | Removed from the JWT to stay under the 4KB cookie limit             |

`session.maxAge` is pinned to the backend's refresh-token lifetime. If it outlives the
backend token the user appears signed in and every request fails.

### The browser never calls the backend directly

`src/client/axiosAuth.ts` points at the same-origin
`src/app/api/backend/[...path]/route.ts` proxy, not at `NEXT_PUBLIC_BACKEND_API`, and
attaches no `Authorization` header itself. The proxy route reads the access token
server-side from the encrypted JWT cookie (via `getToken()`) and attaches it there —
the token is never present anywhere client JS can read it, including
`session.accessToken` (deliberately absent from `authOptions.ts`'s `session()`
callback and from `types/next-auth.d.ts`'s `Session` interface), because whatever
that callback returns is exactly what `GET /api/auth/session` and every
`useSession()`/`getSession()` call hand to any script on the page.

This means an XSS bug can replay requests through the proxy for as long as the tab
stays open, but can no longer read or exfiltrate a reusable bearer token — a real
narrowing of blast radius versus the token being a plain client-readable value.

Server-only code that needs the raw access token (the restricted layout's
`getMyPermissions` call, the proxy route itself) reads it via
`src/lib/auth/getServerAccessToken.ts` (Server Components) or `getToken()` directly
(Route Handlers/middleware) — never via `session.accessToken`, which doesn't exist.

`axiosPublic.ts` is the one exception: it calls the backend origin directly, but only
for genuinely unauthenticated endpoints (forgot-password, OTP) that never carry a
token, so there's nothing to proxy there.

### Anything that mints a token pair runs in a route handler

Three backend calls return a **new** `{access, refresh}` pair: token refresh, the
organization switch (a fresh pair whose signed `org_id` claim names the new tenant),
and changing the password (the backend revokes every outstanding refresh token, so it
must hand back a replacement). Each has its own route handler:

| Route                           | Why it cannot be a browser call                      |
| ------------------------------- | ---------------------------------------------------- |
| `/api/auth/refresh`             | Reads the refresh token, which is server-only        |
| `/api/auth/organization-switch` | Response carries a new refresh token                 |
| `/api/auth/change-password`     | Response carries a replacement pair after revocation |

They share `src/lib/auth/sessionCookie.ts`, which re-encodes the JWT and writes it
back with NextAuth's cookie chunking. **None of them returns a token in the response
body.**

This is the part that is easy to get wrong, because it does not look like a token
leak. The organization switch originally called the backend from
`OrganizationContext` and passed the result to `useSession().update({ access,
refresh })` — which reads as plumbing, not as exfiltration. But `update()` runs in
the browser, so the refresh token was a plain client-readable value on the way
through. That is strictly worse than the exposure the proxy above was built to
remove: the access token is short-lived, the refresh token is good for the whole
session.

So the `jwt` callback in `authOptions.ts` **accepts no token from `update()`** — not
`access`, not `refresh`, only display data. That closes the reverse direction too: a
client-writable token slot lets an attacker pin the session to a credential they
control, not just read one. `src/lib/__tests__/authOptionsJwt.test.ts` locks the
contract in both directions.

If you add an endpoint that returns tokens, it needs a route handler. Calling it with
`axiosAuth` from a component puts the pair in the browser, and nothing will fail to
tell you.

### Cookie chunking

The session cookie is split at `CHUNK_SIZE = 3800` bytes. Browsers cap a cookie near
4KB, and a session that exceeds it is silently truncated — the user appears signed in
until the first request fails to parse.

### Refresh rotation — `src/app/api/auth/refresh/route.ts`

Same-origin route that rotates the refresh token and **re-encodes and re-chunks** the
cookie. SimpleJWT blacklists the used refresh token, so the rotated one must be written
back; otherwise the next refresh presents a blacklisted token and the user is logged
out mid-session.

### Single-flight refresh

`axiosAuth` queues concurrent 401s in `failedRequestsQueue` and issues **one** refresh,
replaying the queue on success. Without it, a page issuing five parallel requests when
the token expires fires five refreshes — four of which use an already-rotated,
now-blacklisted token.

## Permissions

Codes are `{resource}:{action}` — `widget:view`, `preferences:manage`.

`manage` subsumes `view`, `create`, `update`, `delete`. It does **not** imply
`execute` or `export`: a user who may edit a record is not thereby entitled to run it
or bulk-extract it. The seeded `Member` role has execute but not export precisely so
that rule stays tested.

`src/lib/helper.ts` implements this and must stay bit-identical to
`common/constants/permissions.py`. `src/__tests__/contracts.test.ts` asserts both the
subsumption list and the exclusion list against the backend's generated contract.

| Helper                           | Use for                                                 |
| -------------------------------- | ------------------------------------------------------- |
| `can(perms, resource, action)`   | Gating a specific control — a delete button             |
| `hasAccess(perms, route, level)` | Route-level, via `ROUTE_PERMISSIONS`                    |
| `getDefaultRoute(perms)`         | Post-login landing; returns `/no-role` for an empty set |

Prefer `can()` with the precise action over the coarse read/write helpers.

### Where permissions come from

`getMyPermissions.ts` is `import 'server-only'` with `cache: 'no-store'`. The
no-store is a **security** requirement, not a performance one: the response is
per-user and differentiated only by the Authorization header, so caching it in Next's
URL-keyed Data Cache could serve one user's permissions to another.

The restricted layout fetches them server-side and seeds `PermissionsContext`, so the
UI has them at first paint; the client then refetches. `PermissionGuard` **fails
closed** once loaded — an unknown permission denies.

A route with no `ROUTE_PERMISSIONS` entry at all also fails closed: `hasAccess()`
returns `false` for it (tested — see `hasAccess` in `src/lib/__tests__/helper.test.ts`,
`'/some-unmapped-route'`), not "open to everyone." A route meant to be reachable by
every authenticated user regardless of permissions — `/dashboard`, or a Sprint 1
static preview with no permission code yet — has to say so explicitly in
`PermissionGuard.tsx`'s `GLOBAL_PATHS`. Omitting it there is not a no-op: it silently
bounces any user who holds at least one *other* permission to `defaultRoute()` on
every visit, which is exactly the bug `/dashboard` shipped with until it was caught by
logging in as a real seeded user rather than a permission-less test account (see
`context/changelog.md`, 2026-09-03).

## Three layers of route protection

None of the first two is a security boundary. Only the backend is.

| Layer                         | File                        | Purpose                                    |
| ----------------------------- | --------------------------- | ------------------------------------------ |
| `ENABLED_PREFIXES`            | `src/proxy.ts`              | Kill switch — turn a page off for everyone |
| `ENABLED_HREFS` / `NAV_ITEMS` | `src/constants/navItems.ts` | Whether the link is visible                |
| `ROUTE_PERMISSIONS`           | `src/constants/roles.ts`    | Whether this user may open the route       |

A route missing from these is a bad experience. **A backend view missing its
permission declaration is a vulnerability.** The client only decides what to render.

`ROUTE_PERMISSIONS` resolves by longest matching prefix, so a child route can require
a narrower permission than its parent.

## proxy.ts (Next 16 middleware)

Not `middleware.ts`. It:

- Blocks the `x-middleware-subrequest` header (CVE-2025-29927), which allowed
  middleware to be bypassed entirely.
- Runs a coarse `getToken` check — presence of a session, not authorization.
- Applies the security headers.
- Redirects unknown or disabled paths to `DEFAULT_LANDING`.

The `matcher` array must list every path the middleware should see. **A route missing
from `matcher` is not protected** — the middleware simply never runs for it.

## Sign-out

Clears the session cookie, the TanStack Query cache (`clearQueryCache` —
explicit, not left to `signOut`'s page navigation to incidentally wipe it), the
preference session (`clearPreferenceSession`), and broadcasts on the `auth`
`BroadcastChannel` so other open tabs sign out too rather than sitting on a dead
session.

## Open-redirect guard

`safeRedirect` rejects absolute and protocol-relative URLs, falling back to
`DEFAULT_LANDING`. `callbackUrl` comes straight from the query string; unchecked, it
hands an attacker a link that looks like your domain and lands on theirs.

## E2E coverage

Three seeded roles — full access, read-only, and no role at all — under separate
Playwright projects. See `context/e2e.md`. The interesting assertions are the negative
ones; a single admin account can only ever prove the happy path.
