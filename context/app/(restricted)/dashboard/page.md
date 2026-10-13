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

## Setup checklist (Sprint-1 gap closure)

New `useSetupChecklist.ts` reads `GET /api/v1/organizations/{id}/setup-checklist/`
(`apps.organizations`'s `SetupChecklistSelector`, never cached, always a
fixed 5-item list in order: `organization_created`, `team_member_invited`,
`agent_created`, `agent_published`, `knowledge_source_added`). Rendered as a
"Get set up" card between the header and the metrics grid, but only while
at least one step is still undone — it disappears once every step is
`done` rather than lingering as a completed checklist nobody needs to see
again.

Two constraints shape it. The query is gated on **both** having an
organization and holding `organization:view`: this route is reachable by
every authenticated user regardless of role (including one with no
organization at all), so an ungated read would 403 on every dashboard render
for them. And each still-outstanding step links to the page where it is
actually done (`CHECKLIST_HREF` in `DashboardView`) — a checklist that only
reports state makes the user hunt for the page. Completed steps are struck
through and deliberately do not link: they are a record, not an action. A
failed read yields no items and the card simply does not render; an
onboarding hint is not worth an error state on the app's home page. A dedicated `GET /api/v1/dashboard/summary/` endpoint also landed
this pass (`kpis.leads`/`kpis.conversations` + a lightweight per-agent
`{id, name, status, agent_type}` list, gated `dashboard:view`) but is
deliberately **not** wired in here: its counts are strictly narrower than
what `useDashboardAnalytics`'s per-agent aggregation already provides
(no range, no escalation/message/unresolved-topic breakdown), so adopting
it would be a regression, not a simplification. Left unused pending a
product decision on whether it's meant to replace the richer client-side
aggregate for a different (e.g. permission-limited) audience.

## Dropped, not wired to nothing

The business-value trend chart (`BusinessValueChart.tsx`, a dependency-free
SVG area chart) and the "Your free trial" promo panel were both fully
fabricated numbers in the Sprint 1 preview with no backend concept behind
them (no billing/trial system, no pipeline-value metric) — both are deleted
rather than left rendering static data next to real numbers, which would
misrepresent which parts of the page are live. `PreviewBanner` is gone from
this page.

## Get set up checklist (2026-10-07)

`useSetupChecklist` reads each item's `optional` flag from the backend (only
`team_member_invited` is optional, backend 2026-10-07). An optional step is sorted
last, carries an "Optional" badge and is left out of the `done of total`
count, so the list completes without inviting anyone (client: "more a
question than an action"). Every row shows a hint from
`t.dashboard.checklist.hints`, which explains the two steps the platform ticks
on signup ("Done for you") and what completes knowledge. The knowledge step
links to the first agent's `?tab=knowledge` instead of the catalog, and the
card links to `/guide`. A line under the metric cards explains the zeros on a
new account.

Still backend-side: the selector counts any knowledge source as done, even a
pending one, while the agent checklist waits for `ready`.

## Two-step verification tip (2026-10-13)

`useSecurityTip` reads `GET /auth/mfa/status/` and shows a dismissible card
linking to `/user-profile` while MFA is off. Dismissal is a per-browser
`localStorage` flag; the tip stays hidden during server render.
