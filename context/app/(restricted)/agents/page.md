# Agents

**Source:** `src/app/(restricted)/agents/page.tsx`, view in
`components/AgentsListView.tsx`. Detail route:
`src/app/(restricted)/agents/[agentId]/page.tsx`, view in
`[agentId]/components/AgentDetailView.tsx`.

Real, backend-wired CRUD against `apps/agents` (YB Inspire Sprint 1 Phase 2,
`origin/sprint-1-phase2-6-snapshot` on the backend). Replaces the Sprint 1
static preview that rendered the fixed `AGENT_CATALOG` marketplace card grid.

## List page

`AgentsListView` follows the `ProjectsList` pattern exactly: `useAgentsList()`
(`hooks/useAgentsList.ts`) owns `useQueryParams('agents')`, the `?type=parameters`
query, and the paginated `GET /api/v1/agents/` query; the component is a pure
presenter with the four designed states (loading skeleton, error+retry, two
empty variants, populated table). `AgentsTable`/`AgentsTableSkeleton` render
name/status/inbox email/updated columns. `CreateAgentDialog` (Zod schema
`src/lib/schemas/agent.ts`, `useCreateAgentForm`) posts `AgentCreateSerializer`'s
fields; `enabled_languages` is entered as a comma-separated string and split
client-side rather than a full language-picker, kept intentionally simple for
Sprint 1. Gated on `agent:create`.

This redesigned the page rather than reusing the mock's marketplace-card
layout — a real, filterable/sortable/paginated agent list doesn't fit a fixed
4-card grid, and the category/feature-checklist content in the old mock had
no backend equivalent (`Agent` has no `category` or `features` field). The
mock's `AGENT_CATALOG` (`../agentCatalog.ts`) is **not deleted** — the
dashboard's "Agent performance" section still renders it until Phase 3 wires
the dashboard to real analytics.

## Detail page (`/agents/[agentId]`)

Header carries a "Knowledge sources" link to `/agents/[agentId]/knowledge`
(gated `knowledge:view`; see that route's own context doc).

Four tabs, each backed by its own hook under `[agentId]/hooks/`:

- **Overview** (`AgentOverviewTab`) — edit `name`/`human_inbox_email`/`status`
  (`PATCH /agents/{id}/`, gated `agent:manage`) and delete (`DELETE`, gated
  `agent:delete`, soft-deletes and redirects to the list).
- **Draft** (`AgentDraftTab`) — edits `instructions`, `disclosure_enabled`, and
  the _default language_'s three required localized-text fields
  (`greeting`/`fallback_message`/`disclosure_text` — the ones
  `AgentService.publish()` checks). `useAgentDraft` reads the draft via an
  empty-body `PATCH /agents/{id}/draft/`, since the backend exposes no `GET`
  for it — `AgentService.update_draft()` is documented as a no-op when called
  with no fields, so this doubles as a read. A full per-language editor over
  every `enabled_languages` entry is deliberately out of scope for Sprint 1;
  extend `useAgentDraftForm` when that's needed.
- **Publish** (`AgentPublishTab`) — shows draft/published version numbers,
  `POST .../publish/` (gated `agent:execute`, confirmed via `AlertDialog`),
  and a one-entry "version history" limited to rolling back to the currently
  published version (`POST .../rollback/`) — the backend has no version-list
  endpoint, so a full history browser isn't possible yet.
- **Test** (`AgentTestTab`) — `useAgentTestAsk` posts to
  `POST .../draft/test/`, gated `agent:execute`, rendering the answer,
  confidence decision, and citations from `ChatRuntimeService`.

## Nav and route registration

`src/constants/navItems.ts`'s Agents entry now carries `requiredFunction:
'agent'`. `src/constants/roles.ts`'s `ROUTE_PERMISSIONS` has a `{ prefix:
'/agents', resources: ['agent'] }` entry, and `/agents` was removed from
`PermissionGuard.tsx`'s `GLOBAL_PATHS` in the same change —
`contracts/permissions.json` was re-vendored from the backend snapshot first
(`agent:{view,manage,create,delete,execute}`). `/conversations`, `/leads`,
`/analytics` remain in `GLOBAL_PATHS` until their own phase.

`src/proxy.ts`'s `ENABLED_PREFIXES`/`config.matcher` already listed `/agents`
from the Sprint 1 preview; unchanged here.

## Not yet built (later phases)

Allowed domains and deployment keys have no UI yet — they land under
`/agents/[agentId]/settings` in Phase 4. Knowledge sources are live; see
`context/app/(restricted)/agents/[agentId]/knowledge/page.md`.
