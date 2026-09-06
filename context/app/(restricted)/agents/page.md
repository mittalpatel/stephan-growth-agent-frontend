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
empty variants, populated grid). `AgentsGrid`/`AgentsTableSkeleton` render the
list as `ai-agents-platform`-style cards (icon tile, status pill, footer CTA)
rather than a plain data table — a `md:grid-cols-2` grid of `Card`s, each
showing an `agent_type.name` eyebrow (`AgentType`, the backend's
platform-wide agent-kind catalog — `apps/agents`' `4f22fd5` commit; today
always "Website Sales & Support", the only `is_available` type), name,
status, `human_inbox_email` (as "Routes to …", the closest real field to the
reference's free-text description), and an "Open agent" button.

**Agent creation is back**, via `CreateAgentDialog` (`hooks/
useCreateAgentForm.ts`, Zod schema `agentCreateSchema` in
`src/lib/schemas/agent.ts`) — rendered in `PageHeader`'s `actions` and in
the empty state, gated `agent:create`. This reverses an explicit mid-session
decision to remove it entirely; a later, more explicit spec (the backend
team's "Agent + Knowledge Base API — Frontend Reference" doc) put it back,
now correctly wired to the `AgentType` catalog the earlier, deleted version
predated. The dialog's `agent_type` field is an `RHFSelectField` sourced
from `useAgentTypes()` (the same cached `ALL_AGENT_TYPES_KEY` query
`/agents/types` uses) **filtered to `is_available`** — it never offers one
of the 3 unavailable types as a choice, and preselects the one available
type when there's only one, so the common case needs no extra click.
`enabled_languages` is still a comma-separated text field, not a
language-picker, kept simple per the original Sprint 1 scope.

No `FilterToolbar` (search/sort/status-filter bar) on this list either —
removed as unnecessary clutter against the reference's clean card-grid look:
agents are few per organization (unlike conversations/leads, which stay on
`FilterToolbar`), and the reference itself has no search bar on its
marketplace page.

## Agent types (`/agents/types`)

The reference's marketplace has a fixed category tab-filter (Sales/
Marketing/Growth/Automation) and a per-agent capability checklist. The
backend added a real, platform-wide `AgentType` catalog (`apps/agents`'
`4f22fd5` commit) that's the genuine equivalent of that category concept —
4 seeded types (Website Sales & Support, SEvO, Content Strategy, Lead
Outreach), only the first `is_available`. `agent_type.name` is shown
per-card on the list above and on the Overview tab's read-only "Agent type"
row.

Even with creation back, the full 4-type catalog (including the 3
unavailable ones) still isn't visible from the create dialog — a dedicated,
purely informational page covers that:
`src/app/(restricted)/agents/types/page.tsx` → `AgentTypesView`. It calls
`GET /api/v1/agents/types/?include_unavailable=true` (`useAgentTypes()`
hook, `AGENT_TYPES_KEY`/`agentTypesEndpoint(true)` in
`src/services/agents.ts`) — a query param added specifically for this page
on `AgentTypeListView`, opt-in rather than a change to the endpoint's
default (creatable-only) response, so nothing else that might come to rely
on "only creatable types" from the default call breaks. Cards show
`is_available` as an "Available"/"Coming soon" `StatusBadge` (a local tone
map, distinct from `AgentsGrid`'s `AgentStatus`-keyed one) and no CTA at
all — informational only. Linked from `/agents`'s `PageHeader` actions
("Browse agent types").

Per-type `AgentTypeCapability` rows (the reference's capability-checklist
equivalent) are still not exposed via any API, so that part of the
reference card remains unmatched on both pages — no data to render. The
reference's static "Level 1 · Basic" / "Free during trial" footer line on
`AgentsGrid` is per-card there too (not data-driven) — kept verbatim
(`t.agents.levelBasic`/`freeDuringTrial`, leftover strings from the old
marketplace mock). The mock's `AGENT_CATALOG` (`../agentCatalog.ts`)
is deleted as of Phase 3 — the dashboard's "Agent performance" section reuses
`useAgentsList()` directly (see `context/app/(restricted)/dashboard/page.md`).

## Detail page (`/agents/[agentId]`)

Header carries a "Knowledge sources" link to `/agents/[agentId]/knowledge`
(gated `knowledge:view`) and, as of Phase 4, a "Settings" link to
`/agents/[agentId]/settings` (gated `agent:manage`) for allowed domains and
deployment keys; see each route's own context doc.

Four tabs, each backed by its own hook under `[agentId]/hooks/`:

- **Overview** (`AgentOverviewTab`) — edit `name`/`human_inbox_email`/`status`
  (`PATCH /agents/{id}/`, gated `agent:manage`), a read-only "Agent type" row
  (`agent.agent_type.name` — no `PATCH` support for changing it after
  creation, `AgentWriteSerializer` has no such field), and delete (`DELETE`,
  gated `agent:delete`, soft-deletes and redirects to the list).
- **Draft** (`AgentDraftTab`) — edits the full draft config per the backend
  spec doc: `instructions`, `disclosure_enabled`, a required-localized-text
  section (`greeting`/`fallback_message`/`disclosure_text`, the three
  `AgentService.publish()` checks) repeated **per `enabled_languages`
  entry** (not just the default language), `theme_config`'s three named
  keys (`primary_color`/`logo_url`/`launcher_position` as plain text
  inputs — the backend defines no enum for `launcher_position`, so this
  isn't a `<Select>`), `notes`, and `behavior_config`/`qualification_config`
  as raw JSON textareas (both are genuinely freeform on the backend — only
  validated as "must be an object" — so there's no fixed field set to build
  real inputs for; a client-side parse failure blocks submit with an inline
  error before ever reaching the network). `useAgentDraft` reads the draft
  via an empty-body `PATCH /agents/{id}/draft/`, since the backend exposes
  no `GET` for it — `AgentService.update_draft()` is documented as a no-op
  when called with no fields, so this doubles as a read. `useAgentDraftForm`
  uses `applyApiError` (not the older `getAxiosError`+toast pattern it used
  before this pass) since `behavior_config`/`qualification_config`/`notes`
  can receive real field-keyed backend errors worth binding inline. The
  three optional `LocalizedTextKey`s beyond the required trio
  (`unsupported_language_message`, `human_requested_confirmation`,
  `information_email_sent_confirmation`) still have no form UI — bounded
  scope, not an oversight; the type already supports adding them later.
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
(`agent:{view,manage,create,delete,execute}`). `/conversations` and `/leads`
got the same treatment in Phase 3, once `conversation`/`lead` permission
codes were wired in — see those pages' own context docs. `/analytics`
remains in `GLOBAL_PATHS` — no permission code exists for it yet.

`src/proxy.ts`'s `ENABLED_PREFIXES`/`config.matcher` already listed `/agents`
from the Sprint 1 preview; unchanged here.

## Related pages

Knowledge sources: `context/app/(restricted)/agents/[agentId]/knowledge/page.md`.
Allowed domains, deployment keys, and the embed snippet (Phase 4):
`context/app/(restricted)/agents/[agentId]/settings/page.md`.
