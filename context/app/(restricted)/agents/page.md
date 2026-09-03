# Agents (Sprint 1 static preview)

**Source:** `src/app/(restricted)/agents/page.tsx`, view in
`components/AgentsListView.tsx`

A static preview of `frontend-plan-v3.md` §3.1's agents list, rebuilt to match the
`ai-agents-platform` reference build's `AgentsMarketplace` page exactly — eyebrow +
heading + subheading, a category filter pill row (All/Sales/Marketing/Growth/
Automation), a 2-column card grid (icon, Active badge, description, a 2×3 feature
checklist, "Level 1 · Basic" / "Free during trial", "Open agent"), and a dark
"Tier 4 · Customized" CTA band. A `PreviewBanner` (see `components.md`) makes the
mock-data status visible in the UI itself, not just in this doc.

The four cards come from `../agentCatalog.ts`'s `AGENT_CATALOG` — the same catalog
`DashboardView`'s "Agent performance" section renders, so the two pages can't drift
into two different mock agent lists. Each entry's `category` field drives the filter
pills; content (name, description, features, metrics) is ported field-for-field from
the reference build's `data/agents.ts`.

No hook, no service, no `useQueryParams` — none of the plan's real list conventions
(URL state, the four designed states, `data.data` unwrapping) apply yet because there
is nothing to fetch. When the backend ships `GET /api/v1/agents/`, replace
`AGENT_CATALOG` with the real `useAgentsList()` + `AgentsTable` + `AgentsSkeleton`
structure described in the plan's §3.4, and remove the banner.

## Nav and route registration

Registered in `src/constants/navItems.ts` (`ENABLED_HREFS`, `NAV_ITEMS`) and
`src/proxy.ts` (`ENABLED_PREFIXES` **and** `config.matcher` — the matcher entry is
easy to miss and is the one that actually gates the route; a route present in
`ENABLED_PREFIXES` but absent from `matcher` is reachable unauthenticated with no
CSP headers, since the middleware never runs for it at all). Deliberately **not**
in `ROUTE_PERMISSIONS` yet or gated with `requiredFunction`: the `agent` permission
code doesn't exist in `contracts/permissions.json` until the backend adds it (plan
§3.3). Add both once the contract is re-vendored.

## `/agents/[agentId]`

A matching static preview of the overview screen: a back link, status pill, the
plan's tab list (§3.1) rendered as inert labels, and a setup checklist. `agentId`
from the URL is only used to derive a display name (title-cased slug) — there is no
real agent behind it.
