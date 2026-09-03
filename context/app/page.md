# Root (`/`) — marketing landing page

**Source:** `src/app/page.tsx`, view in `src/components/marketing/LandingPage.tsx`

The public homepage: hero, a feature grid drawn from `frontend-plan-v3.md`'s
Sprint 1 deliverables, a three-step "how it works", a CTA band, and a footer
with the legal links. Copy lives in its own `t.marketing` namespace so a future
homepage rewrite never touches auth copy by accident.

A server component throughout — nothing on it needs client state. `Sign in` /
`Get started` are plain links to `/login` and `/signup/create`.

## Reachable only when signed out

Two independent checks, matching the pattern `(public)/layout.tsx` uses for
`/login` and its siblings:

1. `src/proxy.ts` treats `/` as public via an **exact match**, not by adding it
   to `PUBLIC_PATHS` (every pathname starts with `/`, so that would make the
   whole app public). An authenticated request to `/` is still redirected to
   `DEFAULT_LANDING` by `handleAuthenticatedRequest`'s own `pathname === '/'`
   check, which predates this page and was already there for exactly this
   case.
2. `page.tsx` itself re-checks the session server-side and redirects if one
   exists — belt and suspenders, not the only gate.

## The stats row shows illustrative numbers

`t.marketing.stats` (4 active agents, 128 conversations, 64 leads) are fixed
marketing copy, not real data — the same category of placeholder as
`DashboardView`'s mock metrics, just presented as an illustrative example
rather than flagged with `PreviewBanner` (that component is for authenticated
Sprint 1 preview pages; a marketing page showing an illustrative number is
normal for the genre and needs no disclaimer).
