# Agent knowledge

**Source:** `src/app/(restricted)/agents/[agentTypeSlug]/knowledge/components/KnowledgeSourcesView.tsx`.

Introduced in Sprint 1 Phase 2 (`apps/knowledge`), reworked for the backend's
2026-09-06 org-shared-knowledge change.

**This is a tab, not a route.** It owned `/agents/[id]/knowledge` until the
agent detail page moved to the reference platform's tabbed layout; that
`page.tsx` is deleted and `AgentDetailView` renders this as its Knowledge
tab, gated `knowledge:view`. The view lost its own back-link and page header
in the move, since the detail page owns both now. The components and hooks
stay in this folder, which is now a plain directory rather than a route
segment.

## Knowledge is org-shared, not agent-owned (backend 2026-09-06)

`KnowledgeSource.agent` was removed on the backend: a crawl or PDF now
belongs to the organization, and an agent optionally narrows to a subset of
the org's sources through `AgentKnowledgeTarget`. **No target rows means the
agent reads everything**, which is the fallback in
`KnowledgeSourceSelector.resolve_applicable_sources()` — the empty set is
"unnarrowed", never "reads nothing".

Frontend consequences, all in `src/services/knowledge.ts`:

- Creation and listing moved off the agent prefix:
  `GET /knowledge/`, `POST /knowledge/website/discover/`,
  `POST /knowledge/pdfs/`. The old `agents/{id}/knowledge/sources|website/discover|pdfs`
  endpoints are gone, and calling them 404s.
- `knowledgeSourcesListKey()` takes no agent id any more. One org-wide cache
  entry, so a source added from any agent's page invalidates the list every
  other agent reads.
- `KnowledgeSourceListItem`/`KnowledgeSource` no longer carry an `agent`
  field.

**The page is still routed under the agent**, which is a deliberate choice
rather than leftover structure. Two reasons: crawl-job progress is only
readable through `agents/{id}/knowledge/crawl-jobs/{job}/`, so the
add-website flow needs an agent id to poll at all; and narrowing — the thing
an operator usually comes here to adjust — is meaningless without one. The
list is labelled `t.knowledge.list.sharedNotice` so its scope is not mistaken
for per-agent.

### The narrowed-agent trap, and how it is avoided

`AgentCrawlJobDetailView` filters the job by `resolve_applicable_sources()`.
For a _narrowed_ agent, a source it just created is not yet in its target
set, so its own crawl-job poll would 404 mid-flow and the discovery step
would hang. `useKnowledgeTargets.includeSource` closes this: both add flows
call it with the new source id the moment the source exists, and it appends
to the target set only when the agent is actually narrowed. For an
unnarrowed agent it is correctly a no-op, since adding one row there would
silently narrow the agent to exactly that one source.

## List page

`useKnowledgeSources` (`hooks/useKnowledgeSources.ts`) follows the
`useAgentsList` pattern — `useQueryParams('knowledge')`, paginated
`GET /knowledge/` (org-wide; it takes no agent id). Unlike agents, this endpoint's
selector (`KnowledgeSourceSelector.build_parameters_config()`) is never
wired up by its view to `?type=parameters`, so the hook builds its
`FilterConfig[]` by hand from the client-known `status`/`source_type` enum
values (`src/services/knowledge.ts`'s `KNOWLEDGE_SOURCE_STATUS_VALUES`/
`_TYPE_VALUES`) rather than fetching them — a backend gap, not a frontend
choice; if the view ever adds the route, this can switch to fetching like
`useAgentsList` does.

`KnowledgeSourcesTable` renders name/type/status/updated, with a per-row
`DropdownMenu` for rename (`knowledge:manage`), reprocess
(`knowledge:execute`), recrawl (website sources only, `knowledge:execute`),
and delete (`knowledge:manage`) — `useKnowledgeSourceActions.ts` owns these
mutations, each invalidating the source list on success.

## Add website flow

`AddWebsiteDialog` is a five-step dialog driven by `useAddWebsiteFlow.ts`'s
state machine (`form → discovering → review → extracting → done`, plus a
failure state per polling step):

1. **form** — `root_url` (`WebsiteDiscoverSerializer`'s only required field)
   plus an "Advanced crawl options" `Collapsible`, default closed, for
   `scope_config`: `max_pages`, `max_depth`, `include_paths`, `exclude_paths`.
   These sit on the same `WebsiteDiscoverFormValues` as `root_url` but are
   assembled into the nested `scope_config` object only at submit time, by
   `useAddWebsiteFlow.ts`'s `buildScopeConfig` — an untouched advanced
   section still posts exactly `{ root_url }`, unchanged from before this
   field existed. `POST /knowledge/website/discover/` (org-level). `onCreated`
   fires here, not at the end of the flow, so a narrowed agent can see the
   source before its own crawl-job read has to resolve it.

   `scope_config` was already accepted by this endpoint (a raw, unvalidated
   `JSONField`) but silently ignored until the backend's `822e91c` (harden
   website-crawling pipeline) made it real. Its keys, mirrored from
   `apps/knowledge/services/crawl_scope.py`:
   - `max_pages` (positive int): narrows, never exceeds, a plan-tier ceiling.
   - `max_depth` (non-negative int, default 3 server-side): `0` is a real,
     meaningful value (seed page only, follow no links), not something to
     fall back away from. `websiteDiscoverSchema` accepts `max_pages`/
     `max_depth` as `'' | number` rather than a bare coerced number, because
     a native number input reports "untouched" as `''`, and
     `z.coerce.number()` alone would turn that into `0` and silently submit
     it — reintroducing at the form layer the exact bug class this backend
     commit fixed server-side.
   - `include_paths`/`exclude_paths` (`string[]`, via `RHFStringListField`,
     `{value:string}[]` at the form layer): matching is by path-segment
     boundary (`/blog` covers `/blog/post-1`, not `/blogger-signup`), stated
     explicitly in the field description so an operator doesn't assume
     substring matching.
   - `render_js` is documented on the backend but deliberately inert (no
     headless-browser support yet) — no UI field for it, since a control
     that does nothing is worse than no control.

   The API performs no per-key validation on `scope_config` itself (it's
   parsed only at crawl time), so `websiteDiscoverSchema` adds its own
   sanity caps (`max_pages` ≤ 1000, `max_depth` ≤ 10, path lists ≤ 20 items)
   purely to stop obviously broken input the server won't reject on its own.

2. **discovering** — `useCrawlJob.ts` polls
   `GET .../knowledge/crawl-jobs/{id}/` every 3s until the job leaves
   `pending`/`running`. The website source id needed for every later step
   comes from the discovery `CrawlJob.website_source` field, not the
   discover response directly (the view never serializes it there).
3. **review** — `useDiscoveredUrls.ts` lists
   `GET /knowledge/website/{id}/discovered-urls/` and toggles selection via
   `PATCH .../discovered-urls/` (`select_ids`/`deselect_ids`), one bulk call
   per checkbox rather than batched client-side — the list is small enough
   that this keeps selection state server-driven. Also wires the same
   endpoint's `add`/`remove_ids`: a text input above the list (`addUrl`)
   posts `{ add: [url] }` for a page outside what discovery found, and each
   row has a "Remove" button (`removeUrl`, `{ remove_ids: [id] }`) that
   drops the page outright — distinct from deselecting, which keeps the row
   visible but excludes it from extraction.
4. **extracting** — `POST /knowledge/website/{id}/extract/`, polled the same
   way as discovery.
5. **done** — the knowledge sources list is invalidated so the new source
   shows up with its post-extraction status.

## Add PDF flow

`AddPdfDialog` + `useAddPdfSource.ts` — a plain `useState`-managed file
input (not React Hook Form; see `ProjectFilesSection.tsx`'s `Dropzone` for
the established precedent that file inputs are the one exception to the
RHF+Zod rule) posting `multipart/form-data` to `POST /knowledge/pdfs/`
(org-level). Takes an `onCreated` callback for the same narrowing reason as
the website flow.

## Knowledge scope (narrowing)

`KnowledgeTargetsPanel.tsx` + `useKnowledgeTargets.ts` +
`useAllKnowledgeSources.ts` — `GET`/`PUT
/agents/{id}/knowledge/targets/`, gated `knowledge:view` to read and
`knowledge:manage` to write (the backend splits them via
`method_permissions`).

Presented as two explicit modes rather than one checkbox list with a zero
case, because the difference is about the future: an agent on "all sources"
picks up sources added later, a narrowed one does not. Clearing every
checkbox is deliberately _not_ the same as choosing "all", so the save button
stays disabled on an empty selection instead of silently un-narrowing the
agent.

`useAllKnowledgeSources` is a separate read from the paginated list on
purpose: the picker must show every source to be correct, and the toolbar's
page/search/filter state would otherwise decide which sources an operator can
narrow to. It requests one max-size page (`page_size=100`, the backend's
`DefaultPagination.max_page_size`) and reports the shortfall in the UI rather
than silently truncating if an org ever exceeds that.

Saving invalidates the health summary as well as the targets read — health's
source and chunk counts are computed from exactly this set.

The panel holds local edits in a single nullable `edit` object and _derives_
the unedited case from server state rather than copying it in via an effect,
so a refetch can never leave the two out of sync. `save` takes an `onSaved`
callback that fires only on success, which is what lets it drop local edits
at the right moment: keeping them through a failed save is the difference
between retrying and retyping.

## Search index

`IndexVersionsPanel` + `useIndexVersions.ts` — its own local pagination
(not URL-namespaced; it's a side panel, not the page's primary list), lists
`GET /agents/{id}/knowledge/index-versions/` and triggers
`POST /agents/{id}/knowledge/build-index/`, gated `knowledge:execute`. This
is where publishing's index-readiness guard becomes visible: a failed
publish because the index isn't `ready` surfaces as the backend's own error
message via the existing `useAgentActions` toast, not a separate frontend
check.

## Knowledge health (Sprint-1 gap closure)

`KnowledgeHealthPanel.tsx`/`useKnowledgeHealth.ts` renders a live snapshot
above the sources list: `GET /agents/{id}/knowledge/health/`
(`KnowledgeSourceSelector.get_health_summary`, never cached) —
`{score, last_updated, sources, indexed_chunks}`, gated `knowledge:view`
same as the list itself. The response shape did not change with the
org-shared move, but its _meaning_ did: the counts now cover whatever
`resolve_applicable_sources()` returns for this agent, so they follow the
narrowing set rather than a set of agent-owned rows.

The score is shown as `n/100` and suppressed to a dash when `sources === 0`:
the backend returns `0` in that case, which reads as "broken" rather than
"nothing added yet". A failed read renders an inline message with a retry
rather than leaving the panel on its skeleton forever.

## Route protection

No new `ROUTE_PERMISSIONS` entry — `{ prefix: '/agents', resources: ['agent']
}` already covers every `/agents/[agentId]/**` route at the "can view an
agent at all" level, matching how the agent detail page's Draft/Publish tabs
are already gated at the component level despite sharing one route. Finer
`knowledge:{view,manage,execute}` checks live in the components above via
`usePermissions().can()`.
