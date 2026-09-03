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
otherwise renders **inline mock data only**, ported field-for-field from the
`ai-agents-platform` reference build (its `Dashboard.tsx` + `data/agents.ts` +
`data/platform.ts` + `data/organization.ts`): a 5-card metric row with trend deltas
(`METRICS`), an "Agent performance" grid built from the shared `AGENT_CATALOG`
(`../agents/agentCatalog.ts`), a dependency-free SVG area chart
(`BusinessValueChart.tsx`, matching the reference's recharts version without adding
the dependency) with its 7D/30D/90D toggle, a "Your free trial" promo card, and a
recent-activity feed with per-actor icons. It carries a `PreviewBanner` (see
`components.md`) because none of it is wired to a real endpoint yet.

Replace `METRICS` / `AGENT_CATALOG` / `MOCK_ACTIVITY` with a real hook (e.g.
`useDashboardSummary()`) once the backend ships an aggregate endpoint, and remove the
`PreviewBanner` in the same change — that removal is the signal the page is real.

## Trial framing is mock content, not a real claim

"21 days remaining" and the trial promo card mirror the reference build's own mock
data — this product has no billing/trial system yet (see `HeaderOne.tsx`'s
`TRIAL_DAYS_REMAINING`, the same kind of fixed placeholder). It's presented here
because the whole page is already flagged as a preview by `PreviewBanner`, not
because it's a real subscription state.
