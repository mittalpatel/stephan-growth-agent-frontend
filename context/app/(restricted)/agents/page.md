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

Which tab is open is React state seeded from `?tab=`, and the URL is kept in
step with `window.history.replaceState` rather than `router.replace`. The
earlier version derived the tab straight from `useSearchParams`, which meant
every click was a client-side navigation: Next re-requests the route from the
server, that request passes through the auth proxy in `src/proxy.ts`, and the
new tab only renders once the response commits. On a deployed server that
round-trip is slow enough to see, and on an expired session it never commits at
all, so the address bar showed the new tab while the panel stayed on the old
one. Locally it is instant, which is why it only ever reproduced on the server.
An effect still follows the URL back into state, so Back/Forward and a
permission gate retiring the open tab both behave. Any other tab strip added
here should be wired the same way.

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

### Setup checklist (2026-09-09)

`AgentSetupChecklist`, rendered above the `Tabs` block (`canManage` only) as a
single slim row since 2026-10-14 (progress dots, "Next: <step>", Go, and a
Collapsible "Show all steps" list), so the tabs stay above the fold,
exists because nothing previously told an operator what order to do things
in to get a widget live: publish never mentioned domains or keys, and a
brand-new unconfigured agent looked identical to a fully live one across all
eight tabs. Its steps are computed from data already available —
`agent.draft_version !== null`, `agent.published_version !== null`, and
`useAgentReadiness`'s knowledge/domain/key presence checks (a small read-only
hook, deliberately not the Settings tab's own `useAgentDomains`/
`useAgentDeploymentKeys`, which carry mutations this checklist has no
business triggering) — and each unfinished step's "Go" button routes through
the detail view's `requestTab`, the same path the header's Configure button
uses. Collapses to a one-line "ready" banner once all are done.
`useAgentReadiness` shares query keys (`agentDomainsKey`/`agentKeysKey`, plus
the knowledge tab's `useAllKnowledgeSources`) with those hooks, so visiting
either place primes the other's cache for free.

**"Add knowledge" step (2026-09-10).** The list originally went draft →
publish → domain → embed, with no mention of knowledge. These agents answer
strictly from retrieved sources, so an operator who followed the checklist to
completion got a widget that embedded correctly, reported itself healthy, and
fell back on every question. It sits before "publish" because a published
version with nothing to retrieve is the failure being prevented, not a later
refinement. The check is org-wide (`some(status === 'ready')`) rather than
resolved through this agent's `AgentKnowledgeTarget` narrowing, matching the
backend's own fallback that no target rows means the agent reads every shared
source; a narrowed agent pointed only at not-yet-ready sources reads as done
here, which is the acceptable direction to be wrong for a check whose job is
to catch "no knowledge at all". Hidden entirely without `knowledge:view`,
since such a reader can neither verify nor act on it.

Note that a website source is marked `ready` by the backend as soon as
_discovery_ finishes (`_run_discovery` promotes it from `pending` once
`discovered_count` is non-zero), before any page has been extracted — so this
step can tick while the underlying pages are still unextracted. Per-page truth
lives in the knowledge tab's pages panel, which labels that state "Not
extracted yet".

### Publish tab stale after publish/rollback (2026-09-15)

`useAgentActions` used to invalidate only `agentDetailKey(id)`, but this page
reads `agentByTypeKey(slug)` (`useAgentDetail`), so after a publish the Publish
tab kept showing the old live version and a draft that no longer existed. Update,
publish and rollback now write their response (the full `AgentSerializer` body)
into both keys and invalidate the draft and the list. Writing rather than
refetching also avoided a backend bug found in the same live test: `publish()`/
`rollback()` never cleared the by-type server cache, so a plain reload could
still show the old version. **Fixed backend-side 2026-09-16**: both now also
call `invalidate_agent_caches()`; our `applyAgent` write-through above stays as
belt-and-braces since it's still the fastest path to a consistent UI (no round
trip needed).

### Active tab lives in the URL (2026-09-15)

The active tab was a bare `useState('overview')`, so refreshing the page or
sharing the URL always landed back on Overview. It now reads/writes `?tab=` via
`useSearchParams`/`useRouter().replace` (not `push`, so switching tabs doesn't
grow the Back-button history) instead of local state. `isAgentTab` validates
the raw param against the fixed `AGENT_TABS` list, and `isTabVisible` further
checks it against this viewer's `conversations`/`prospects`/`knowledge` gates —
either failing falls back to Overview rather than mounting a tab with no
`TabsContent`, which covers a stale bookmark, a typo, or a link shared by
someone with broader permissions than the person opening it.

### Unsaved draft changes (2026-09-10)

Radix unmounts inactive `TabsContent`, so switching away from Draft destroyed
every unsaved field with no warning — and the natural next step after writing
instructions is the Knowledge tab, with the checklist above actively sending
people between tabs. `DraftForm` reports `formState.isDirty` up through
`AgentDraftTab`'s `onDirtyChange`, `AgentDetailView` holds it as `isDraftDirty`,
and `requestTab` intercepts any switch away from a dirty Draft to confirm
first (`pendingTab` holds the destination until the user chooses). Every tab
entry point goes through `requestTab` rather than `setTab` — the `Tabs`
`onValueChange`, the checklist's "Go", and the header's Configure button — so
there is no path around the guard. `useBeforeUnloadWarning` covers the leaves
the app can't intercept (refresh, tab close, back button); it deliberately
takes no message, since browsers ignore custom text and show their own.

`useAgentDraftForm.submit` now calls `form.reset(form.getValues())` after a
successful save. `handleSubmit` leaves `isDirty` set, which would strand the
warning after the save it belongs to; re-baselining on the submitted values
rather than waiting for the invalidated refetch keeps that independent of
TanStack's structural sharing, which can return the identical object and never
re-run the draft-load reset effect.

### Draft form progressive disclosure (2026-09-09)

`AgentDraftTab`'s `DraftForm` used to render ~20+ fields flat, including two
raw JSON textareas, in one scroll. Non-essential groups are now wrapped in a
local `DraftSection` (built on `src/components/ui/collapsible.tsx`'s
`Collapsible`, previously unused anywhere in the app): "Widget theme" stays
**open** by default (what most edits are for), "Answer tuning" (groundedness
threshold, unsupported-language behavior, retrieval/history tuning,
moderation categories) and "Advanced (developer)" (suggested
questions/prohibited claims plus both raw JSON fields) default **closed**.
Collapsing is presentational only — no field is removed, and React Hook Form
keeps every field's value in its internal state regardless of mount state
(`useAgentDraftForm` sets no `shouldUnregister`), so a value entered then
hidden by collapsing a section still submits correctly.

### Tab UI pass (2026-09-15)

- **Draft**: every group is now a bordered `DraftSection` card, including
  "Instructions and identity" and one "Messages in {LANG}" section per enabled
  language (both open by default). Save lives in a **sticky bar** at the bottom
  of the card with "Discard changes" (`form.reset()`), and is disabled until the
  form is dirty. Select placeholders read "Use default" instead of a bare
  em-dash, and the contrast warning names the background by its field label
  rather than the raw theme key. The no-draft state is an `EmptyState`.
- **Publish**: "Live on your site" and "Draft" are side-by-side cards. The live
  card's badge says "Live", not the agent's own status label, because a
  published version is live even while the agent is paused. The draft card
  links to the Test tab ("Test first") and, with no draft, to the Draft tab;
  `AgentPublishTab` takes `onNavigate` from `AgentDetailView`'s `requestTab`
  for this. The Rollback card originally passed the currently published
  version's id, so it could only re-publish what was already live; see
  "Real rollback version picker" below for the 2026-09-16 fix.
- **Setup checklist**: a "{done} of {total} done" count with a progress bar,
  numbered steps, and only the next unfinished step gets the filled button.
- **Overview**: an all-zero metrics row gets a one-line "no activity yet" note.

### One place to create a deployment key (2026-09-09)

`DeploymentKeysSection` and `EmbedSnippetSection` used to be two independent
entry points that **each minted its own separate live key**
(`POST /agents/{id}/keys/` vs `POST /agents/{id}/embed-code/`) with no
relationship to each other — a user clicking both ended up with two live
keys and no signal which one was "the" one. `EmbedSnippetSection` (now
labeled "Get your embed code") is the only place a key gets created;
`DeploymentKeysSection` (now "Issued keys") is read-only-plus-revoke, and its
own `issueKey`/`RevealDeploymentKeyDialog` reveal flow was deleted rather
than kept as a second working path. `useAgentEmbedCode`'s `generate()` now
invalidates `agentKeysKey` on success so the issued-keys list picks up the
new key immediately. Settings tab order changed to match the sequence a user
needs: Identity → Allowed Domains → Get your embed code → Issued keys —
domains before the embed code, since the widget silently refuses to load
without one, and copy on both cards now says so explicitly instead of
assuming the reader already knows why an allowlist/credential exists.

No backend changes were needed for any of this — `POST /agents/{id}/keys/`
still exists (it's simply no longer called from the UI), and every value the
checklist/copy needs came from endpoints that already existed.

### Unsupported-language message field (2026-09-09, revised same day)

`AgentService._assert_localization_complete` originally required
`localized_text[<lang>].unsupported_language_message` for every enabled
language whenever `unsupported_language_behavior` was (or defaulted to)
`polite_decline`, but `useAgentDraftForm`'s `buildLocalizedTextDefaults`
never built that field — it was never rendered, editable, or sent in the
`PATCH /agents/{id}/draft/` body, so every agent hit a 400 on first publish
(`missing_language_localization`) with no way to fix it from the UI. Added
`unsupported_language_message` alongside greeting/fallback/disclosure in the
per-language block in `AgentDraftTab`, and initially added a client-side
`superRefine` on `agentDraftUpdateSchema` requiring it per language when
`polite_decline` applied, mirroring the backend guard.

The backend then dropped the requirement entirely (same day,
`apps/agents/services/agent_service.py`): `_assert_localization_complete` no
longer requires this key at all, and both the publish check and
`ChatRuntimeService._handle_unsupported_language` fall back to a new
`DEFAULT_UNSUPPORTED_LANGUAGE_MESSAGE` platform default when an operator
hasn't set one, so a live `polite_decline` reply is never blank. The
frontend's `superRefine` was removed to match — the field stays in the form
(and in `LocalizedText`) as an optional per-language override, labeled
"(optional)" with copy noting a default is used when left blank. No backend
changes needed on the frontend side for this revision; it's a pure relaxation
of validation already tracked here.

### Draft, Publish, Test

- **Draft** — edits the full draft config per the backend spec doc:
  `instructions`, `disclosure_enabled`, `display_name` (added 2026-09-09,
  replacing the removed `notes` field — the widget-facing bot name shown in
  the chat header, distinct from `Agent.name`; falls back to it server-side
  when blank), a required-localized-text section
  (`greeting`/`fallback_message`/`disclosure_text`, the three
  `AgentService.publish()` checks) repeated **per `enabled_languages`
  entry**, the full `theme_config`/`behavior_config` shape validated
  server-side by `ThemeValidationService`, and the full
  `qualification_config` rule set (see below). `useAgentDraft` reads the draft via
  `GET /agents/{id}/draft/` (backend 2026-09-07; previously this view was
  `PATCH`-only, and the hook worked around the missing `GET` with an
  empty-body `PATCH`, since `AgentService.update_draft()` is a no-op write
  when called with no fields). The three optional `LocalizedTextKey`s beyond
  the required trio still have no form UI: bounded scope, not an oversight.

  **No-draft state (2026-09-09)**: `publish()` clears `Agent.draft_version`
  (`AgentService.publish()`), so `GET /agents/{id}/draft/` 404s with
  `agent_no_draft` right after every publish — an expected, settled state,
  not a stuck load. `AgentDraftTab.tsx` used to render the loading skeleton
  forever in this case (`isLoading || !draft`, and `!draft` never clears once
  the query settles into a 404). It now checks `useAgentDraft`'s `isNotFound`
  and shows a real empty state instead, with a "Start editing" button that
  calls `createDraft()` — an empty-body `PATCH /agents/{id}/draft/`, which
  clones the published version into a fresh draft server-side
  (`AgentService.update_draft`) without changing any field. The draft form
  itself is never rendered pre-filled with its own blank defaults for this
  state, since the first save would then overwrite the freshly-cloned
  published content with blanks.

  **Theme/behavior config** (`useAgentDraftForm.ts`, `AgentDraftTab.tsx`):
  `theme_config`'s nested `colors` (now an 8-key palette; `accent` was
  dropped 2026-09-09 as low-value form complexity), `typography.font_family`,
  `widget.*` (`position`/`launcher_shape`/`mode` — `panel_size`/`shadow`/
  `mobile_layout` were removed the same commit, since the real embeddable
  bundle renders one fixed size/shadow and doesn't yet vary by mobile
  layout) and `logo.*`, plus `behavior_config`'s `suggested_questions` and
  `prohibited_claims`, are hoisted into flat, typed form fields —
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
  doesn't show them as unset. `logo.favicon_url` remains a settable,
  unvalidated key, but `ThemeCascadeService` stopped populating it from
  `OrganizationBranding.favicon_url` 2026-09-09 — "Reset to org default" no
  longer fills an unset one.

  **Behavior runtime tuning** (2026-09-09): the keys
  `apps.runtime.services.chat_runtime_service` actually reads
  (`groundedness_threshold`, `retrieval_context_turns`,
  `max_history_messages`, `moderation_self_harm_categories`,
  `unsupported_language_behavior`) are now validated by
  `ThemeValidationService.validate_behavior_config` for the first time, and
  are real structured fields under "Answer tuning" rather than raw JSON —
  the same promotion the removed `voice.answer_length`/`formality`/
  `terminology`/`prohibited_phrases` controls never got before being deleted
  entirely as unused config surface (nothing in `apps.runtime` ever read
  them). `groundedness_threshold`/`retrieval_context_turns`/
  `max_history_messages` use the same `'' | number` schema shape
  `websiteDiscoverSchema` established for `max_pages`/`max_depth`
  (`src/lib/schemas/knowledge.ts`): a native number input reports "untouched"
  as `''`, and a bare `z.coerce.number()` would turn that into `0` and
  silently submit it — `groundedness_threshold: 0` is a real, in-range value
  that must survive as `0`, not "unset". Any other key `behavior_config`
  carries at runtime (e.g. an org-cascaded `voice.tone`) has no fixed shape
  and stays in the "Advanced behavior config" raw-JSON field, stripped of
  the keys the structured fields above own so the two representations never
  fight over the same data.

  **Handoff trigger phrases** (backend 2026-09-17): `behavior_config
.handoff_trigger_phrases` is validated the same way as
  `moderation_self_harm_categories` (same `stringListField()`, no client-side
  ceiling), but renders in its own **"Handoff"** `DraftSection`, not folded into
  "Behavior & Runtime" — it's a list of phrases that, when a visitor's own message
  contains one, deterministically hands the conversation off to a human before any
  moderation/retrieval/completion call, which is a big enough behavior change to
  deserve its own heading rather than reading as another answer-tuning knob. It is
  easy to confuse with `qualification_config.trigger_phrases` ("Trigger phrases"
  under "Lead qualification", the very next section) since both are phrase lists
  with the same field label, but they gate unrelated things: this one hands off to
  a human, the qualification one forces the lead-capture form suggestion on a
  match (backend `ce3631b`; before that it only vetoed the model's own call). The "Handoff" section's own heading/description and the qualification
  section's heading/description are what actually disambiguate them — an operator
  scanning section titles sees "Handoff" and "Lead qualification" as two different
  concerns before ever reading either field's own copy. A match produces an
  escalation with `reason=handoff_trigger_matched` — see
  `context/app/(restricted)/conversations/page.md`'s escalation-reasons coverage.

  **Tool toggles** (backend `467f1d0`): `behavior_config.lead_capture_enabled`,
  `human_handoff_enabled`, `send_information_email_enabled` render as
  `RHFSwitchField`s: handoff at the top of "Handoff", lead capture at the top of
  "Lead qualification", information email at the end of "Behavior & Runtime".
  Unset on the server means enabled, so the form defaults each to `true`, and
  `buildBehaviorRuntimeFieldsPayload` always sends all three explicitly so
  re-enabling persists over a stored `false`. When handoff or lead capture is off,
  that section's trigger-phrase list is disabled (watched via `useWatch`), since
  the backend ignores those phrases too.

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

  **Save is blocked client-side while any pair is failing**, not just
  flagged: `AgentDraftTab.tsx`'s `getContrastFailures()` (the same function
  `ColorContrastNotice` uses per field) is also checked at the form level,
  and the Save button is `disabled` whenever it returns anything, with
  `t.agents.detail.draft.saveBlockedByContrast` explaining why next to it.
  Before this, the button stayed enabled through a visible failing-contrast
  warning and the PATCH would fire anyway, only to bounce off the exact
  same check server-side with a generic 400, since
  `ThemeValidationService._assert_colors_pass_contrast` rejects unconditionally
  on any `CONTRAST_CHECKED_PAIRS` failure. The server check remains the
  actual authority (`bindContrastErrors()` above still exists for whatever
  a client-side check misses or gets stale), but a submit should not be
  reachable at all while the same page is already showing the reason it
  will fail.

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

  **Live preview** (`WidgetPreview.tsx`): the widget renders as a real
  floating launcher, portalled to `document.body` and pinned to the viewport
  corner named by `widget_position`, at the launcher's real 56px size.
  Clicking it opens the panel, exactly as a visitor to the operator's own
  site would meet it. It replaced an earlier scaled-down mock-in-a-sidebar
  (browser-chrome frame, desktop/mobile toggle), which answered "what does
  it roughly look like" but not "does this size and corner feel right on a
  page" — the question the preview exists for. The form is full width again
  as a result, and a dashed note at the top of the tab says where the
  preview lives.

  As of 2026-09-09 the real embeddable bundle exists
  (`apps/widgetgw/assets/widget.js`, served by `WidgetJsView` at
  `${WIDGET_SCRIPT_BASE_URL}/widget.js` — the embed script referenced no
  actual JS anywhere before this, so an embedded bot never rendered on a
  customer site). The panel's 340x480 size and its shadow are no longer a
  config choice at all (`widget_panel_size`/`widget_shadow` were removed from
  `theme_config` the same commit) — `PANEL_WIDTH`/`PANEL_HEIGHT`/
  `PANEL_SHADOW`/`LAUNCHER_SHADOW` mirror the bundle's own literal CSS values
  exactly, not an approximation. The header shows `display_name` (falling
  back to `Agent.name`), matching `WidgetConfigView`'s own fallback.

  It stays in sync via `useWatch` on the whole form, so every theme/behavior
  field (including ones edited outside the theme section, like the greeting,
  disclosure text, and suggested questions) reflects immediately with no
  save. The portal matters: the draft card's own overflow and sticky context
  would otherwise clip a `fixed` child.

  This is still a reconstruction from the same theme/behavior values, not
  the actual bundle rendered in an iframe — `position`/`launcher_shape`/
  `mode` remain real config the preview reflects, though note the Sprint-1
  bundle itself currently only implements `bottom_right`/`bottom_left`
  (any other position falls back to `bottom_right` in the real widget) and
  doesn't yet vary its launcher shape or color mode — a real, current gap in
  `widget.js`, not something this preview should paper over by silently
  degrading too. Unset colors fall back to the backend's own seeded starter
  palette (`apps/agents/seed_data.py`) so a fresh agent's preview matches
  what it will actually publish with. As of 2026-09-09 that seed is YB
  Inspire's official brandbook v1.0 (Teal Inspire/Bleu pétrole/Bleu nuit on
  white text, Work Sans, pill launcher, dark mode), replacing the earlier
  placeholder palette; `WidgetPreview.tsx`'s `FALLBACK_COLORS`/font/launcher
  fallbacks were updated to match. The brandbook's CTA yellow (`#F5E723`) has
  no home in this schema since `colors.accent` was already dropped, a known
  gap flagged in the backend's own seed comment, not reintroduced here.

  **Field descriptions**: every theme/behavior field (and `instructions`,
  the disclosure toggle, and the per-language localized-text fields) carries
  a one-line description under its label via the RHF primitives' new
  `description` prop (`fieldDescriptionCls` in `fieldStyles.ts`), explaining
  what the field actually changes rather than leaving the operator to infer
  it from the label or trial-and-error the widget theme.

- **Publish** — draft/published version numbers, `POST .../publish/` (gated
  `agent:execute`, confirmed via `AlertDialog`), and rollback (`POST
.../rollback/`) via a real version picker (see below).

  **Publish error codes (2026-09-10 sync)**: `useAgentActions`'s
  `publishMutation.onError` branches on `getErrorCode(error)`
  (`AgentService.publish()`'s three reachable codes) instead of always
  showing a generic toast: `no_draft` (draft cleared by a prior publish,
  `t.agents.toast.publishNoDraft`) and `disclosure_cannot_be_disabled`
  (`t.agents.toast.publishDisclosureRequired`) get dedicated copy since
  they're expected, reachable states, not surprise failures.
  `missing_language_localization` still falls through to `getAxiosError`,
  since the backend's own message text already lists which
  languages/fields are missing (`errors.localized_text[0]`) and there's no
  separate structured field to bind to — `custom_exception_handler` only
  ever forwards `code` and the single interpolated message, never the
  per-language `errors` dict the service raises internally. The backend's
  now-removed `index_not_ready` code (dropped 2026-09-09, publish no longer
  requires a ready knowledge index) was never handled here, so there's
  nothing to migrate away from.

- **Test** — `useAgentTestAsk` posts to `POST .../draft/test/`, gated
  `agent:execute`, rendering the answer, confidence decision, and citations
  from `ChatRuntimeService`.

  **Test console (2026-09-15)**: the tab is a session log rather than a single
  answer box. `useAgentTestAsk` keeps an in-memory list of turns
  (`pending`/`done`/`error`, each retryable), cleared by "Clear" or leaving the
  tab. **The endpoint is single-turn**: it takes one `question` and never sees
  earlier turns, so the UI says so beside the input rather than implying chat
  memory. Before the first question it shows the draft's greeting for
  `agent.default_language` and its `behavior_config.suggested_questions` as
  one-click chips. Each answer shows its decision badge with a one-line
  plain-language meaning and a collapsed source list. The question is a
  RHF+Zod form (`agentTestQuestionSchema`, field `question` matching
  `AgentTestAskRequestSerializer`); Enter asks, Shift+Enter adds a newline.
  States: no `agent:execute` shows a locked empty state instead of a form that
  would 403; with no draft but a published version (normal right after a
  publish) the console tests the live version, loaded through
  `useAgentVersion` (`GET /agents/{id}/versions/{version_id}/`), with a
  "Testing the live version" badge, matching the backend's
  `tested_version` fallback (2026-10-07). Only an agent with neither version
  shows the "Create draft" empty state.

  **Markdown rendering (2026-09-11)**: `result.answer` and each citation's
  `excerpt` are markdown (the answer's own formatting, and — since the
  backend's `d86388e` switched extraction to Scrapling's Markdown
  conversion — real headings/lists/links in an excerpt pulled from a crawled
  page). Both used to render as a plain `<p>`, so `**bold**` and
  `[text](url)` showed as literal syntax with no clickable links. Both now
  go through `src/components/common/Markdown.tsx` (`react-markdown` +
  `remark-gfm`, no `dangerouslySetInnerHTML` — the library maps the parsed
  AST straight to React elements, which is what makes it safe to point at
  crawled/model-generated text with no separate sanitizer). Links always get
  `target="_blank" rel="noopener noreferrer"`, since they point at citation
  sources, never this app's own routes.

### Lead qualification rules (2026-09-14)

`qualification_config` was a raw JSON textarea in the "Advanced (developer)"
section until the backend gave it a real schema
(`apps/agents/qualification_schema.py` + `ThemeValidationService
.validate_qualification_config`, branch `lead-qualification-l1-02-2026-09-14`).
It now has its own collapsed `DraftSection`, "Lead qualification", above
Advanced, with four controls: trigger phrases (`RHFStringListField`), required
fields (`RHFCheckboxGroupField`), weighted scoring rules
(`RHFObjectListField`), and the two thresholds.

It follows the same **flatten-on-load / reassemble-on-submit** boundary
`theme_config`/`behavior_config` already use: `qualificationFieldsFromConfig()`
splits the stored object into flat `qualification_*` form fields, and
`buildQualificationConfigPayload()` puts it back. The form field names
therefore do _not_ match the serializer's 1:1, which is the documented
exception to the usual naming rule.

Two things about that builder are load-bearing:

- **Unknown keys are carried across a save** by spreading the loaded draft's
  own config. `cooldown_minutes` and anything org-cascaded still pass through
  the backend unvalidated, and the backend merges `qualification_config` by key
  presence only among the keys actually sent. Without the spread, saving from
  this form would silently drop them. Unlike `behavior_config`, they are not
  parked in a visible raw-JSON field, since no operator hand-edits them.
- **`scoring` is written all-or-nothing.** `QualificationService.evaluate()`
  reads either threshold being absent as "no scoring configured" and forces
  `unqualified` regardless of score, so a half-set `scoring` is a schema-legal
  permanent no-op. The Zod schema rejects it client-side and the builder omits
  the key entirely rather than sending `{}`.

The client schema mirrors every backend rule, including the two that exist
precisely because a legal-looking config silently did nothing: both-or-neither
thresholds, and no duplicate `questions[].field` (which `evaluate()` would sum
twice, scoring double the configured weight). Duplicates are reported on the
offending row via a `path`, not once for the whole list.

Backend errors still arrive keyed `qualification_config` —
`_run_application_error_as_validation_error` flattens the nested `field="scoring"`
away — so `bindQualificationError()` hand-binds that message onto
`qualification_questions`, the same mutate-then-delete contract
`bindContrastErrors()` uses so remaining errors still reach `applyApiError`.

`QUALIFIABLE_LEAD_FIELDS` (`name`, `phone`, `interest_note`) is mirrored in
`src/lib/constants/agentTheme.ts`. `email` is absent by design: every lead
already has one, so scoring it would hand out free points to everybody.

### Real rollback version picker (2026-09-16)

`GET /agents/{id}/versions/` (`AgentVersionListItemSerializer`, most recent
`version_number` first, never cached server-side) replaced the placeholder
Rollback button that could only re-publish the version already live. New
`useAgentVersions(agentId, enabled)` fetches lazily — only once the rollback
`AlertDialog` opens, not alongside the agent detail — since the list is
unbounded and the endpoint is deliberately never cached, mirroring the
backend's own reasoning for not caching it. `AgentPublishTab` renders a
shadcn `Select` inside the confirm dialog, excluding the currently published
version from the choices, with all four states designed: a `Skeleton` while
loading, an inline retry on error, "No earlier versions to roll back to" when
the filtered list is empty, and each populated row labeled with its publisher
email (falling back to its created date when never published).

### Lead-capture consent and thank-you text (2026-09-16)

The backend added two optional `LocalizedTextKey`s — `consent_text` (shown
above the widget's lead form) and `thank_you_text` (shown after a successful
submission) — both published into `WidgetConfigView.lead_capture` and both
falling back to a platform default when blank. Wired in following the exact
`unsupported_language_message` precedent: added to `LocalizedText`
(`src/types/agent.ts`), `localizedTextEntrySchema`
(`src/lib/schemas/agent.ts`), `LocalizedTextFormValues`/
`buildLocalizedTextDefaults` (`useAgentDraftForm.ts`), and two more
`<textarea>` blocks per language in `AgentDraftTab.tsx`'s "Messages in
{LANG}" section. `useAgentDraftForm.submit` already forwards `values
.localized_text` wholesale, so no field whitelist needed updating.

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

## Required to qualify vs. required on the form

Backend 2026-09-17 split `qualification_config.required_fields` (only feeds
`QualificationService`'s "required to qualify") from the new
`form_required_fields` (only marks widget form fields required). Unset on the
server falls back to `required_fields`, so `qualificationFieldsFromConfig`
seeds `qualification_form_required_fields` the same way and
`buildQualificationConfigPayload` always sends both: saving an untouched form
never changes what the widget asks for. The form checkbox group is disabled
when lead capture is switched off.

## Updates 2026-10-07

- **Catalog:** category tabs are hidden while the catalog has 4 or fewer
  entries (`useAgentCatalog().showCategoryFilter`), and a hidden filter no
  longer filters.
- **Agent detail:** a one-line purpose is shown under the tab row for Draft,
  Publish and Test (`t.agents.detail.tabPurpose`).
- **Agent setup checklist:** the draft step counts as done once a version is
  published (publishing clears `draft_version`, which capped the list at 4 of
  5). Done steps keep a "Review" button, and the knowledge step explains what
  completes it.

## Test tab answer label (2026-10-14)

The backend stores `answered` for any reply that is not an explicit "no answer",
including greetings, off-topic replies and refused prompt injections. `AnswerView`
therefore shows "No sources used" (warning tone) for `answered` with zero
citations, and the fallback label for an empty answer. Only the label changes; the
stored decision is untouched so analytics does not count greetings as unresolved.
