# Security

**Read this when:** touching auth, rendering user-supplied content, adding a dependency,
or changing the CSP.

## The frontend is not a security boundary

Everything here reduces attack surface and improves UX. **The backend is what protects
the data.** Any check reproduced client-side exists so the UI agrees with the server, not
instead of the server.

## Tokens

Access token in memory, refresh in an httpOnly chunked cookie, permissions fetched
out-of-band. [ADR-0007](../adr/0007-token-storage.md).

Never put a token in `localStorage`. Never log one. Never put one in a URL — URLs land in
browser history, server logs, and `Referer` headers.

## `NEXT_PUBLIC_` is public

Anything so prefixed is inlined into the client bundle and readable by anyone. A secret
there is a published secret. Server-only values (`SENTRY_AUTH_TOKEN`, `NEXTAUTH_SECRET`)
must never carry the prefix.

## proxy.ts

- Blocks `x-middleware-subrequest` — **CVE-2025-29927**, which allowed middleware to be
  bypassed entirely
- Sets the security headers
- **A route missing from `matcher` is unprotected**: the middleware never runs for it

## CSP

Built in `next.config.ts` from `NEXT_PUBLIC_BACKEND_API`, so `connect-src`, `img-src`,
and `next/image` remote patterns cannot drift apart.

Adding a third-party host means adding it in **both** `thirdPartyImgHosts` and
`images.remotePatterns` — one alone either blocks the request at the CSP or makes
`next/image` refuse to optimize it, and the two failures look nothing alike.

## Rendering user content

Never `dangerouslySetInnerHTML` with anything a user supplied. If HTML must be rendered,
sanitize with a maintained library on a strict allowlist.

React escapes by default in JSX; the dangerous surfaces are that prop, `href` (a
`javascript:` URL is executable — validate the scheme), and anything reaching `eval` or
`new Function`.

## Open redirects

`safeRedirect` rejects absolute and protocol-relative URLs. `callbackUrl` is
attacker-controllable.

## Dependencies

| Gate                                                                            | Where          |
| ------------------------------------------------------------------------------- | -------------- |
| `eslint-plugin-security`                                                        | Every lint run |
| Semgrep (`p/javascript`, `p/react`, `p/nextjs`, `p/owasp-top-ten`, `p/secrets`) | pre-push, CI   |
| Gitleaks, full history                                                          | CI             |
| `npm audit --omit=dev --audit-level=high`                                       | CI             |
| CycloneDX SBOM                                                                  | CI artifact    |

The npm supply chain is a realistic threat: a transitive dependency running at build or
runtime has the same access your code does. That is the concrete reason the access token
is not in `localStorage`.

## Secrets in the repo

Gitleaks runs on staged files pre-commit and over full history in CI. A secret that
reaches a commit must be **rotated**, not just removed — the history keeps it, and so do
any forks and clones.
