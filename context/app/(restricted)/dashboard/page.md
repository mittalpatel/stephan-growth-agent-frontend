# Dashboard

**Source:** `src/app/(restricted)/dashboard/page.tsx`, view in
`components/DashboardView.tsx`, hook in `hooks/useDashboardAnalytics.ts`.

`DEFAULT_LANDING` in `src/constants/navItems.ts` points here, and the proxy, the
post-login redirect, and `safeRedirect`'s fallback all read that constant. Keep this
route reachable by **every** authenticated user regardless of role: it has no
`requiredFunction` and no `ROUTE_PERMISSIONS` entry, so nothing can gate it.

Pointing `DEFAULT_LANDING` at a permission-gated page instead sends anyone lacking that
permission into a redirect loop — the app bounces them to a page it then refuses.

## Sprint 1 Phase 3: real aggregates, client-summed

There is no org-wide analytics endpoint — only `GET
/agents/{id}/analytics/summary/?range=7d|30d|90d` (`apps.conversations`,
5-minute server cache). `useDashboardAnalytics` fetches `useAgentOptions()`'s
agent list, then fires one `useQueries` per agent against that endpoint and
sums the five counts (`conversation_count`, `message_count`,
`escalation_count`, `lead_count`, `unresolved_topic_count`) client-side. The
7D/30D/90D toggle re-fires every per-agent query with the new `range`. The
same per-agent results (`perAgent`) back the "Agent performance" grid, so
each card shows that agent's own conversation/lead counts rather than
fabricated ones — no separate per-agent metrics endpoint exists.

The "Agent performance" grid itself now reuses Phase 1's `useAgentsList()`
for identity/status (name, `AgentStatus` badge, link to `/agents/{id}`) —
`agentCatalog.ts`/`AGENT_CATALOG` is deleted; the marketplace-card fields it
carried (icon, category, `metricALabel`/`metricAValue`, `valueGenerated`)
had no backend equivalent.

"Recent activity" is now the org's five most-recently-captured leads
(`GET /api/v1/leads/?sort=created_at&sort_direction=desc&page_size=5`), not
a mixed activity feed — there is no activity-log endpoint spanning
conversations/content/integrations to source one from.

## Dropped, not wired to nothing

The business-value trend chart (`BusinessValueChart.tsx`, a dependency-free
SVG area chart) and the "Your free trial" promo panel were both fully
fabricated numbers in the Sprint 1 preview with no backend concept behind
them (no billing/trial system, no pipeline-value metric) — both are deleted
rather than left rendering static data next to real numbers, which would
misrepresent which parts of the page are live. `PreviewBanner` is gone from
this page.
