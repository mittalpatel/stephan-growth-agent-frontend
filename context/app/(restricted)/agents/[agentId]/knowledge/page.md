# Agent knowledge sources

**Source:** `src/app/(restricted)/agents/[agentId]/knowledge/page.tsx`, view
in `components/KnowledgeSourcesView.tsx`.

Net-new page (Sprint 1 Phase 2 of the frontend integration plan,
`origin/sprint-1-phase2-6-snapshot` on the backend, `apps/knowledge`). No
mock precedent — nested under the agent per the plan's routing decision.
Linked from `AgentDetailView`'s header (a "Knowledge sources" button, gated
`knowledge:view`).

## List page

`useKnowledgeSources` (`hooks/useKnowledgeSources.ts`) follows the
`useAgentsList` pattern — `useQueryParams('knowledge')`, paginated
`GET /agents/{id}/knowledge/sources/`. Unlike agents, this endpoint's
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

1. **form** — `root_url` only (`WebsiteDiscoverSerializer`'s one required
   field), `POST .../knowledge/website/discover/`.
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
RHF+Zod rule) posting `multipart/form-data` to
`POST /agents/{id}/knowledge/pdfs/`.

## Search index

`IndexVersionsPanel` + `useIndexVersions.ts` — its own local pagination
(not URL-namespaced; it's a side panel, not the page's primary list), lists
`GET /agents/{id}/knowledge/index-versions/` and triggers
`POST /agents/{id}/knowledge/build-index/`, gated `knowledge:execute`. This
is where publishing's index-readiness guard becomes visible: a failed
publish because the index isn't `ready` surfaces as the backend's own error
message via the existing `useAgentActions` toast, not a separate frontend
check.

## Route protection

No new `ROUTE_PERMISSIONS` entry — `{ prefix: '/agents', resources: ['agent']
}` already covers every `/agents/[agentId]/**` route at the "can view an
agent at all" level, matching how the agent detail page's Draft/Publish tabs
are already gated at the component level despite sharing one route. Finer
`knowledge:{view,manage,execute}` checks live in the components above via
`usePermissions().can()`.
