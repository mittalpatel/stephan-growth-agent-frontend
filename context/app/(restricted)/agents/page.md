# Agents

**Source:** `src/app/(restricted)/agents/page.tsx`, view in
`components/AgentsListView.tsx`. Detail route:
`src/app/(restricted)/agents/[agentTypeSlug]/page.tsx`, view in
`[agentTypeSlug]/components/AgentDetailView.tsx`.

Real, backend-wired against `apps/agents`, laid out to match the
`ai-agents-platform` reference platform's own agent flow (`#/agents` and
`#/agents/website-sales`): one marketplace page listing every agent kind, and
a tabbed workspace per agent.

## Routing by type slug, not agent id

The detail route is `/agents/website_sales_support`, not
`/agents/<uuid>`. It resolves through `GET /agents/by-type/<slug>/`
(`AgentDetailByTypeView`, `agentByTypeEndpoint`/`agentByTypeKey` in
`src/services/agents.ts`, consumed by `useAgentDetail`).

This is what that endpoint was added for. Agents are a fixed,
auto-provisioned roster with no create flow, so the frontend never learns an
agent's UUID from anything the user did, and a per-kind URL is the only
stable thing to address. The slugs are the backend's own
(`AgentTypeSlug` in `apps/agents/constants.py`), underscores included, so
they round-trip through the route without a mapping table.

A 404 from that endpoint means this organization has no agent of that kind,
which is the normal state for the three types the backend hasn't shipped. It
renders as the "not found" empty state rather than an error.

## Marketplace (`/agents`)

`AgentsListView` is a pure presenter over `useAgentCatalog()`, which merges
three sources because no single one has the whole picture:

- `useAgentTypes()` for the four kinds and which are available (itself
  merging the live catalog with the local roadmap, see below).
- `useAgentOptions()` for this organization's provisioned agents, matched to
  their kind by `agent_type.slug`. One live agent per available type
  (`AgentService.provision_defaults`), so this is a lookup, not a grouping.
- `AGENT_TYPE_ROADMAP` for category and capabilities, which no API exposes.

Cards carry an icon tile, a `StatusBadge`, the description, a capability
checklist, and a footer pairing the commercial level with the open CTA.
**Only a card whose type is provisioned is linked** — the other three render
a disabled-look span of the same size/position instead of the `Link`, since
`by-type/` would 404. Always rendering something in that slot (not omitting
it) keeps every card's footer row the same height and alignment as the
reference, even though the state underneath stays honest.

The page closes with `AgentTierBanner`, the inverted Level 4 panel from the
reference. It is deliberately not a `Card`: the grid above is what the
organization already has, and this is the one thing on the page that has to be
bought, so it reads as a different surface. `bg-foreground`/`text-background`
inverts with the theme rather than pinning a dark slab into dark mode. Its CTA
goes to `/organization/billing`.

Each kind gets its own icon-tile colour from `AGENT_TYPE_ACCENTS`, mapped onto
the four chart tokens rather than the reference's raw hexes — the same four
hues, already tuned for both themes and for colour-blind separation. They are
stored as whole utility pairs (`'bg-chart-1/10 text-chart-1'`) because a
template-built `bg-chart-${n}/10` compiles to nothing. Purely decorative: the
name and the badge carry every meaning the colour hints at.

The badge has **three** states, deliberately not two:

| Condition                 | Badge                                     | Linked |
| ------------------------- | ----------------------------------------- | ------ |
| `agent` present           | its own `status` (Active/Paused/Archived) | yes    |
| `isAvailable`, no `agent` | "Not set up" (warning)                    | no     |
| not `isAvailable`         | "Coming soon" (neutral)                   | no     |

The status tone map is shared with `AgentDetailView`'s header so one agent
reads the same in both places. Two earlier passes got this wrong: the badge
first hardcoded "Active" for anything provisioned (a paused or archived agent
would have read as running), then collapsed the middle row into "Coming
soon", which reads as "not built yet" and hides a provisioning gap an admin
can actually fix.

**A provisioned agent is what makes a card live, and provisioning is
asynchronous.** `AgentService.provision_defaults` is called from exactly
three places: `OrganizationService.create()`, which enqueues
`organizations.provision_default_agents` via `transaction.on_commit` (moved
off the synchronous path in the 2026-09-07 audit fix); the `provision_tenant`
management command; and that Celery task. Migration 0005 backfills
`agent_type` onto existing `Agent` rows but creates none. So an organization
created with no Celery worker running, or one predating the feature, has zero
agents and every card correctly reads "Coming soon" until the task runs. That
is a deployment state, not a frontend or contract problem.

A category tab bar (All / Sales / Growth / Marketing / Automation) filters
client-side, with the selection in the URL as `agents_category` via
`useQueryParams`' `getParam`/`setParam`. An unknown value falls back to
"all" rather than showing an empty grid.

This replaces the split this page used to have, where `/agents` listed only
provisioned agents (one card) and a separate `/agents/types` page listed the
roadmap. That route and its `AgentTypesView`/`AgentTypesSkeleton` are
deleted. There is no create action and no `FilterToolbar`: the roster is
fixed and four cards need neither search nor pagination.

## Three of the four kinds come from a local constant

`GET /api/v1/agents/types/` (`AgentTypeListView`) calls
`AgentTypeSelector.get_available()`, which filters `is_available=True`
unconditionally, and the view reads **no query parameters at all** — there is
no way to ask the backend for the unavailable types, and none of the three
has any other API surface. An earlier version called
`?include_unavailable=true`, a parameter that has never existed in the
backend on any branch (`git log -S` finds no match in its history); it was
silently ignored, so the page rendered a single card.

`useAgentTypes()` merges the live response against `AGENT_TYPE_ROADMAP`
(`src/constants/agentTypes.ts`, copy in `t.agents.types.roadmap`) by slug:
the backend's own name/description/availability win wherever it returns a
row, the roadmap fills in the rest as not-yet-available, and a served type
the roadmap has never heard of is appended rather than dropped so the API can
outgrow the constant.

The roadmap also carries `category`, `capabilities`, `workflow` and the Level 2
`upgrade` copy, none of
which any API exposes: `AgentTypeSerializer`'s fields are
`("id", "slug", "name", "description", "is_available")`, and
`minimum_plan_tier` isn't serialized either, so no plan/tier gating of agent
access is expressible on the frontend yet.

### Capabilities are the backend's, even though they arrive locally

`AgentTypeCapability` rows are real and seeded, but nothing returns them over
HTTP: the model appears in `models.py`, `constants.py`, `seed_data.py`, the
`seed_agent_types` command, two migrations, `admin.py` and its tests, and in
no serializer, view or URL. Django admin is the only place they can be read.

So the frontend mirrors them instead of inventing copy.
`AGENT_TYPE_CAPABILITY_KEYS` lists the `capability_key` values
`AGENT_TYPE_SEED_DATA` seeds, row for row: four for Website Sales & Support
(`supports_website_knowledge`, `supports_pdf_knowledge`,
`supports_lead_capture`, `supports_human_handoff`) and none for the other
three, which seed `"capabilities": []`. Labels live in
`t.agents.capabilities`, keyed by those exact values, because
`capability_key` is an identifier and never display copy: even once the API
serves capabilities, the endpoint settles _which_ ones, never what they are
called.

`AGENT_TYPE_ROADMAP.capabilities` is therefore derived, never authored, and
the two sources never mix. A kind the backend declares capabilities for
renders those; a kind it declares none for falls back to
`plannedCapabilities`, which reads as roadmap copy for something unbuilt.
This corrected an earlier pass that copied the reference's six display
strings onto the Website Sales & Support card, two of which
(`Grounded sales conversations`, `Conversation history`) the backend never
declares: the card was advertising capabilities absent from the product's own
data model. A test pins the rendered set to the seeded four.

When `AgentTypeSerializer` starts nesting `capabilities`, read them from the
response and delete `AGENT_TYPE_CAPABILITY_KEYS`. The keys already match, so
the labels keep working untouched.

This duplicates backend seed data, which is normally the wrong call. It is
scoped to exactly the gap the API leaves, and each entry should be deleted
the moment the backend starts serving that type. The `ai-agents-platform`
reference carries the same four-agent catalog locally, in its own
`data/agents` module, for the same reason.

## Detail page (`/agents/[agentTypeSlug]`)

A header (icon, name, `agent_type.description`, status badge and commercial
level) over eight tabs, with Configure and Upgrade actions on the right as the
reference draws them. Configure switches to the Settings tab, which is why
`Tabs` is controlled here rather than `defaultValue`; Upgrade links to
`/organization/billing` instead of the reference's modal, because there is no
self-serve upgrade to run and a dialog saying "contact us" is a longer route to
the same page.

The tab row uses `TabsList variant="line"` — the full-width underlined row the
reference uses, not the segmented pill. Its triggers need `flex-none`: the
stock `line` variant still inherits `flex-1`, which stretches eight tabs across
the page. The first five mirror the reference's; the last three
have no counterpart there, because the reference mocks its configuration
screen and this app's is real.

- **Overview** (`AgentOverviewTab`) — real headline numbers from
  `GET /agents/{id}/analytics/summary/` via `useAgentPerformance`, with a
  7D/30D/90D range toggle held in component state (a reading preference on
  one tab, not part of what a link points at), rendered through the shared
  `MetricCard`. Then the capability grid, a "how it works" `WorkflowDiagram`,
  and `AgentUpgradeCard` — all three from `AGENT_TYPE_ROADMAP`.

  There is no "conversations over time" area chart, which the reference shows
  here. The app has no charting dependency and, more to the point, no endpoint
  returning a time series: `analytics/summary/` returns four totals. Adding one
  would mean inventing the trend, which is the one thing this tab must not do.

- **Conversations** — `ConversationsListView` with `agentId` pinned, gated
  `conversation:view`.
- **Prospects** — `LeadsListView` with `agentId` pinned, gated `lead:view`.
- **Knowledge** — `KnowledgeSourcesView`, gated `knowledge:view`.
- **Settings** — `AgentSettingsView`, gated `agent:view` internally.
- **Draft** (`AgentDraftTab`), **Publish** (`AgentPublishTab`), **Test**
  (`AgentTestTab`) — unchanged; see the sections below.

Conversations, Prospects, Knowledge and Settings were four separate places
before this: two nested routes (`/agents/[id]/knowledge`, `.../settings`) and
two org-wide pages. They are **the same components**, reused with the agent
pinned, so there is still exactly one implementation of each screen.
`ConversationsListView` and `LeadsListView` take an optional `agentId` that
pins the list and drops the page header; `/conversations` and `/leads` keep
working org-wide with it omitted. `useLeadsList(agentId)` appends to the
user's own filters rather than replacing them, keeping `filter`/`filter_by`
positionally aligned, and maps to `LeadSelector._FILTER_FIELDS`' `agent` key.

The agent's own editable fields (`name`/`human_inbox_email`/`status`,
`PATCH /agents/{id}/`, gated `agent:manage`) moved from Overview to the
Settings tab as `AgentIdentitySection`, matching the reference's split where
Overview carries performance and Settings carries configuration. There is no
delete: the backend removed `DELETE /agents/{id}/` in the 2026-09-07 push
that removed creation, and `agent:delete` is no longer granted by any default
role.

### Draft, Publish, Test

- **Draft** — edits the full draft config per the backend spec doc:
  `instructions`, `disclosure_enabled`, a required-localized-text section
  (`greeting`/`fallback_message`/`disclosure_text`, the three
  `AgentService.publish()` checks) repeated **per `enabled_languages`
  entry**, the full `theme_config`/`behavior_config` shape validated
  server-side by `ThemeValidationService` (backend
  `config-theme-validation-2026-09-08`), `notes`, and `qualification_config`
  as a raw JSON textarea (genuinely freeform on the backend, only validated
  as "must be an object", so there's no fixed field set to build real inputs
  for; a client-side parse failure blocks submit with an inline error before
  ever reaching the network). `useAgentDraft` reads the draft via
  `GET /agents/{id}/draft/` (backend 2026-09-07; previously this view was
  `PATCH`-only, and the hook worked around the missing `GET` with an
  empty-body `PATCH`, since `AgentService.update_draft()` is a no-op write
  when called with no fields). The three optional `LocalizedTextKey`s beyond
  the required trio still have no form UI: bounded scope, not an oversight.

  **Theme/behavior config** (`useAgentDraftForm.ts`, `AgentDraftTab.tsx`):
  `theme_config`'s nested `colors` (9-key palette), `typography.font_family`,
  `widget.*` (position/launcher_shape/panel_size/shadow/mode/mobile_layout)
  and `logo.*`, plus `behavior_config`'s `voice.*`, `suggested_questions`,
  and `prohibited_claims`, are hoisted into flat, typed form fields —
  `src/lib/constants/agentTheme.ts` mirrors the backend's
  `theme_schema.py`/`behavior_schema.py` allowlists, and
  `agentDraftUpdateSchema` (`src/lib/schemas/agent.ts`) validates them with a
  `zodResolver`. This is the same "hoist named keys into real fields, mirror
  the field-name break, hand-bind errors" pattern the pre-existing
  `theme_primary_color`/`theme_logo_url`/`theme_launcher_position` fields
  already set (backend field errors for these do **not** bind through
  `applyApiError`'s automatic name matching, since the flat field names
  don't match the backend's nested serializer field — the submit handler
  hand-binds them). A draft saved by the old UI still has values under the
  legacy flat `theme_config.primary_color`/`logo_url`/`launcher_position`
  keys; `themeFieldsFromConfig()` reads those as a fallback so the new UI
  doesn't show them as unset.

  Everything else `behavior_config` carries at runtime
  (`groundedness_threshold`, retrieval/history tuning, moderation
  categories, `unsupported_language_behavior`) has no fixed shape and stays
  in the "Advanced behavior config" raw-JSON field, stripped of the keys the
  structured fields above own so the two representations never fight over
  the same data.

  **Contrast checking**: `src/lib/contrast.ts` ports
  `ThemeValidationService.check_contrast`'s WCAG AA math client-side for
  instant inline feedback as colors are edited (no network call per
  keystroke — the math is cheap and pure). The backend's
  `POST /api/v1/settings/brand/contrast-check/` remains the final authority;
  a failing PATCH returns `errors.theme_config` shaped as
  `{ [colorKey]: { ratio, passes_aa_normal_text, suggested_fallback } }`,
  which `bindContrastErrors()` binds onto the matching `color_*` field by
  hand (this nested shape is exactly what `applyApiError`'s generic binder
  can't format).

  **Reset to org default**: `GET /agents/{id}/draft/theme-defaults/`
  (`agentThemeDefaultsKey`/`Endpoint` in `services/agents.ts`, queried with
  `enabled: false` inside `useAgentDraftForm` and fired on demand via
  `resetToOrgDefault()`) is fetched only on the button click, not on load,
  and applied over only the currently-unset fields, matching
  `ThemeCascadeService.resolve`'s own "fill only what's absent" rule rather
  than overwriting an operator's in-progress edits.

  Not wired: the org `BrandSettingsTab`'s `color_primary`/`color_secondary`
  have no natural foreground/background pair to contrast-check against
  today (unlike the agent theme's `text`/`background`/`surface`), so the
  bonus "check contrast" affordance considered for that tab was scoped out
  rather than built against an artificial pair.

- **Publish** — draft/published version numbers, `POST .../publish/` (gated
  `agent:execute`, confirmed via `AlertDialog`), and a one-entry "version
  history" limited to rolling back to the currently published version
  (`POST .../rollback/`). The backend has no version-list endpoint, so a full
  history browser isn't possible yet.
- **Test** — `useAgentTestAsk` posts to `POST .../draft/test/`, gated
  `agent:execute`, rendering the answer, confidence decision, and citations
  from `ChatRuntimeService`.

## Nav and route registration

`src/constants/navItems.ts`'s Agents entry carries `requiredFunction:
'agent'`. `src/constants/roles.ts`'s `ROUTE_PERMISSIONS` has a `{ prefix:
'/agents', resources: ['agent'] }` entry, and `/agents` is not in
`PermissionGuard.tsx`'s `GLOBAL_PATHS`. `contracts/permissions.json` still
lists `agent:create`/`agent:delete` as valid codes; the backend's 2026-09-07
RBAC migration revoked them from every default role alongside removing the
endpoints they gated, and nothing in this app references them.

`src/proxy.ts`'s `ENABLED_PREFIXES`/`config.matcher` already listed `/agents`
from the Sprint 1 preview; unchanged here.

## Related docs

Knowledge tab: `context/app/(restricted)/agents/[agentTypeSlug]/knowledge/page.md`.
Settings tab: `context/app/(restricted)/agents/[agentTypeSlug]/settings/page.md`.
