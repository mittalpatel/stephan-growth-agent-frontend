# Dashboard

**Source:** `src/app/(restricted)/dashboard/page.tsx`, view in
`components/DashboardView.tsx`

`DEFAULT_LANDING` in `src/constants/navItems.ts` points here, and the proxy, the
post-login redirect, and `safeRedirect`'s fallback all read that constant. Keep this
route reachable by **every** authenticated user regardless of role: it has no
`requiredFunction` and no `ROUTE_PERMISSIONS` entry, so nothing can gate it.

Pointing `DEFAULT_LANDING` at a permission-gated page instead sends anyone lacking that
permission into a redirect loop — the app bounces them to a page it then refuses.

## Current content: a Sprint 1 static preview

`page.tsx` is a server component (so it can keep the `<title>` metadata export) that
renders the client `DashboardView`, which reads `useUser()` for the greeting and
otherwise renders **inline mock data only** — a metric-card row, an agent-performance
grid, and a recent-activity feed, modeled on the `ai-agents-platform` prototype's
dashboard shape. It carries a `PreviewBanner` (see `components.md`) because none of it
is wired to a real endpoint yet.

Replace `MOCK_METRICS` / `MOCK_AGENTS` / `MOCK_ACTIVITY` with a real hook (e.g.
`useDashboardSummary()`) once the backend ships an aggregate endpoint, and remove the
`PreviewBanner` in the same change — that removal is the signal the page is real.
