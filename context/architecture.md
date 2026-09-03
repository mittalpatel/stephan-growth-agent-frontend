# Architecture

## Stack

| Layer                   | Technology                                                                  |
| ----------------------- | --------------------------------------------------------------------------- |
| Framework               | Next.js 16 — App Router, `src/` directory                                   |
| Language                | TypeScript                                                                  |
| Styling                 | Tailwind CSS v4 — CSS-based config via `@theme inline {}` in `globals.css`  |
| UI Components           | shadcn/ui only — stock neutral theme, `src/components/ui/` (generated)      |
| Auth                    | NextAuth v4 — JWT strategy, Credentials provider (SSO is a documented seam) |
| Data fetching           | TanStack Query v5 — `useAuthQuery` wrapper around `axiosAuth`               |
| Forms                   | React Hook Form + Zod                                                       |
| Date picker             | react-day-picker v10 (use `autoFocus`, not `initialFocus`)                  |
| Testing                 | Vitest (unit), Playwright (E2E)                                             |
| Linting                 | ESLint + lint-staged on pre-commit; typecheck + tests on pre-push           |
| Security (SAST)         | `eslint-plugin-security` (in ESLint config) + Semgrep scan on pre-push & CI |
| Security (secrets)      | Gitleaks — staged scan on pre-commit, full-history scan in CI               |
| Security (supply chain) | `npm audit` (prod deps, CI) + Dependabot PRs + CycloneDX SBOM artifact      |

## Security scanning

Defense-in-depth, the JS/TS equivalent of Python's `bandit` plus surrounding supply-chain
and secret layers. Where each runs:

| Layer                  | Tool                     |   pre-commit    | pre-push |                 CI                  |
| ---------------------- | ------------------------ | :-------------: | :------: | :---------------------------------: |
| SAST (lint rules)      | `eslint-plugin-security` | ✓ (lint-staged) |          |            ✓ (validate)             |
| SAST (taint/data-flow) | Semgrep                  |                 |    ✓     |       ✓ (`security-scan` job)       |
| Secret scanning        | Gitleaks                 |   ✓ (staged)    |          | ✓ (`secret-scan` job, full history) |
| Dependency CVEs        | `npm audit` / Dependabot |                 |          |           ✓ (+ auto-PRs)            |
| Supply-chain inventory | CycloneDX SBOM           |                 |          |            ✓ (artifact)             |

### SAST — the bandit equivalent

Two complementary static-analysis layers:

- **`eslint-plugin-security`** — folded into `eslint.config.mjs` via
  `security.configs.recommended`. Runs everywhere ESLint already runs (lint-staged
  pre-commit, `npm run validate` in CI). Catches `eval`, ReDoS, `child_process`,
  non-literal `fs` paths, etc. `security/detect-object-injection` is disabled (too
  noisy for TS bracket access — Semgrep's taint rules cover real injection sinks).
- **Semgrep** — deeper data-flow/taint SAST. `npm run security` runs
  `scripts/security-scan.mjs`, which prefers a native `semgrep` binary and falls back
  to the `semgrep/semgrep` Docker image. Rulesets: `p/javascript`, `p/react`,
  `p/nextjs`, `p/owasp-top-ten`, `p/secrets` over `src/` (`--error` = fail on finding).
  Runs in the **pre-push** hook and as a dedicated **`security-scan`** CI job.
  `SKIP_SEMGREP=1` bypasses it locally only (CI always enforces). Ignore list in
  `.semgrepignore`.

### Secret scanning — Gitleaks

`npm run secrets` (full history) / `npm run secrets:staged` (staged only) →
`scripts/secret-scan.mjs`, which prefers a native `gitleaks` binary and falls back to the
`ghcr.io/gitleaks/gitleaks` Docker image. The **staged** scan runs first in the
**pre-commit** hook (before lint/test) so a secret never gets committed; a **full-history**
scan runs as the **`secret-scan`** CI job. Allowlist false positives (e.g. `.env.example`
placeholders, test fixtures) in `.gitleaks.toml`. `SKIP_GITLEAKS=1` bypasses locally only.

### Supply chain — audit, Dependabot, SBOM

- **`npm audit --omit=dev --audit-level=high`** in CI fails on high/critical advisories in
  the prod tree (existing gate).
- **Dependabot** (`.github/dependabot.yml`) opens fix PRs for vulnerable/outdated `npm`
  deps (minor/patch grouped weekly; security updates immediate) and for the CI GitHub
  Actions. Activates server-side once pushed to GitHub.
- **CycloneDX SBOM** — `npm run sbom` → `sbom.json` (prod deps, CycloneDX 1.6). Generated
  in CI and uploaded as a 90-day artifact. `sbom.json` is gitignored.

## Folder Structure

```
src/
  app/
    (public)/         # Login, forgot-password, signup — no session required
    (restricted)/     # Authenticated pages
      layout.tsx      # Auth guard + provider stack
      context/        # PermissionsContext, UserContext
      dashboard/      # DEFAULT_LANDING — reachable by every authenticated user
      preferences/
      user-profile/
      widgets/        # Demo module — the list/detail reference implementation
        page.tsx
        hooks/        # useWidgetsList.ts, useWidgetDetail.ts
        components/   # WidgetsList/Table/Grid/Skeleton
        [widgetId]/
    api/              # Route handlers: NextAuth, refresh, logout, health
    legal/
  client/             # axiosAuth.ts (single-flight refresh), axiosPublic.ts
  components/
    common/           # FilterToolbar, DataTable, ListPagination, StatusBadge,
                      # EmptyState, ConfirmDialog, DateRangePicker,
                      # RestrictedBreadcrumb, form/ (RHF primitives)
    header/  layout/  sidebar/  motion/
    ui/               # shadcn primitives — generated, excluded from lint + coverage
  config/             # language.ts — DEFAULT_LANGUAGE, LOCALE_TAG, CURRENCY
  constants/          # navItems.ts (nav + DEFAULT_LANDING), roles.ts, data.ts
  context/            # PreferencesContext
  hooks/              # useAuthQuery, useAuthMutation, useQueryParams,
                      # useDebouncedSearch, useInvalidateCache
  lib/                # helper.ts (permission algebra), i18n.ts, apiError.ts,
                      # apiSuccess.ts, pageMeta.ts, auth/, schemas/
  locales/en/         # The catalog — the only source of user-facing text
  providers/          # Query, Session, Theme, Confirm, Loader
  services/           # listParams.ts (contract), widgets.ts, profile.ts, auth.ts
  types/              # api.ts (envelope), widget.ts, user.ts, next-auth.d.ts
  proxy.ts            # Next 16 middleware — NOT middleware.ts
contracts/            # Backend-generated JSON, asserted in src/__tests__
```

## Key Conventions

- **Business logic in hooks** — components are pure JSX, all state/fetch/transform lives in `hooks/use*.ts`
- **URL-based filter state** — `useQueryParams(namespace)` stores filters in the URL with prefixed keys (e.g. `widgets_page`)
- **Locale via `t.*`** — never hardcode strings; import `t` from `@/locales`. Enforced as an ESLint error, covering `aria-label`/`placeholder`/`alt`/`toast` too
- **Design tokens** — shadcn's stock semantic tokens only (`bg-background`, `text-muted-foreground`, `border-border`). No hex, no raw Tailwind palette classes (`bg-white`, `text-gray-500`) outside `globals.css`. This is what makes dark mode free
- **`Readonly<Props>`** — all component props wrapped in `Readonly<>`
- **No comments** unless the WHY is non-obvious

## Backend host config (`next.config.ts`)

The backend host is **fully env-driven** — `NEXT_PUBLIC_BACKEND_API` (and optionally
`NEXT_PUBLIC_BACKEND_RAW_API`) is the single source of truth. `next.config.ts` parses
the URL(s) and derives the backend origin into **all three** security/asset surfaces so
they never drift:

- CSP `connect-src` — allows XHR/fetch to the backend
- CSP `img-src` — allows `<img>`/background images from the backend
- `images.remotePatterns` — allows `next/image` to optimize backend-served images
  (protocol + port preserved)

Switching backends (localhost / ngrok / staging / prod) is therefore a **pure `.env`
change** — no hardcoded backend hostnames in `next.config.ts`. Only non-backend hosts
stay hardcoded there: Sentry (`o*.ingest.sentry.io`) and any third-party image CDN you
add to `thirdPartyImgHosts`, which ships empty. Add such a host in **both** that array
and `images.remotePatterns` — listing it in only one place either blocks the request at
the CSP or makes `next/image` refuse to optimize it, and the two failures look nothing
alike.

Caveats: `next.config.ts` is read at **build/start time**, so restart `next dev` /
rebuild after editing the env value; and the backend's own CORS allow-list must include
this frontend's origin.
