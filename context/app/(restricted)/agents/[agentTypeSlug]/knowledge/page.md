# Agent knowledge

**Source:** `src/app/(restricted)/agents/[agentTypeSlug]/knowledge/components/KnowledgeSourcesView.tsx`.

Introduced in Sprint 1 Phase 2 (`apps/knowledge`), reworked for the backend's
2026-09-06 org-shared-knowledge change.

**The source list itself is a tab, not a route.** It owned
`/agents/[id]/knowledge` until the agent detail page moved to the reference
platform's tabbed layout; that `page.tsx` is deleted and `AgentDetailView`
renders this as its Knowledge tab, gated `knowledge:view`. The view lost its
own back-link and page header in the move, since the detail page owns both
now. The components and hooks stay in this folder, which is a plain
directory rather than a route segment — **except** `[sourceId]/`, added
2026-09-11: a single source's page list is real enough (search, manual add,
selective recrawl, potentially hundreds of rows) to need its own screen
rather than living inside the tab. See "Per-page management and selective
recrawl" below.

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

`KnowledgeSourcesTable` renders name/type/status/updated. Each website row
carries a visible "View pages" button, with rename (`knowledge:manage`),
reprocess (`knowledge:execute`), recrawl (`knowledge:execute`) and delete
(`knowledge:manage`) behind a per-row `DropdownMenu` —
`useKnowledgeSourceActions.ts` owns the rename/reprocess/delete/recrawl
mutations, each invalidating the source list on success.

**"View pages" is promoted out of the overflow menu (2026-09-10)** and no
longer requires `knowledge:execute`. It was the only route to what a crawl
actually fetched, and behind a three-dot menu it read as there being no
options at all. Viewing is not the privileged act here: the page's own
"Recrawl selected pages" bar and its row checkboxes are what
`knowledge:execute` now gates, so a `knowledge:view` reader gets a plain,
readable list instead of checkboxes wired to a button they never see.

### Per-page management and selective recrawl (backend 2026-09-09)

The backend's recrawl pipeline fix (fixing a false-positive page-removal bug
and a discovery/extraction race, `apps/knowledge`) also shipped an
API surface the frontend had nothing to consume it with: a
`POST /knowledge/website/{id}/recrawl-pages/` endpoint (`{page_ids}`,
1-200 ids, 202/200 duality like the whole-site recrawl) and three new
`DiscoveredUrl` fields — `content_changed_at`, `http_status`,
`content_hash` — plus `removed_count`/`requeued_count` on `CrawlJob`.

Until now there was no way to recrawl anything narrower than the whole site,
and no persistent view of an already-extracted source's pages at all — the
only page list, `useDiscoveredUrls.ts` + `DiscoveredUrlsReview`, exists
solely inside the one-time Add Website wizard's pre-extraction review step.

`useKnowledgeSourcePages.ts` (in `knowledge/hooks/`, shared by the tab and
the dedicated page below) added that missing view: a listing reusing the
same `GET .../discovered-urls/` read and `discoveredUrlsKey` the wizard's
review step uses — same data, just readable outside the wizard now — each
row showing when its content last changed (`content_changed_at`, relative
time) and its last HTTP status (a danger badge at 4xx/5xx). It opens with a
counts summary (pages found, added, not-yet-extracted, failed, skipped)
computed from the loaded rows, since the raw list otherwise answers "which
pages exist" but not "how did the crawl go", which is the first thing
anyone asks once it finishes. `content_hash` is on the type for future
dedup/debugging use but is not surfaced in the UI — it's not something an
operator needs to see day to day. Checking a subset of pages and clicking
"Recrawl selected pages" calls `recrawlSelected`, which posts to
`websiteRecrawlPagesEndpoint` and invalidates the same `discoveredUrlsKey`
on success; the "already running" 200 case reuses the identical
`response.message ?? fallback` toast pattern
`useKnowledgeSourceActions.recrawlMutation` already established for the
whole-site recrawl button. `removed_count`/`requeued_count` are on
`CrawlJob` for completeness but have no dedicated display yet — no
`CrawlJob` count is rendered anywhere in this feature today, so this follows
the existing pattern of tracking the job by polling status only.

**Its own route, search, and manual add (2026-09-11).** The view first
shipped as `KnowledgeSourcePagesPanel.tsx`, a `Sheet` opened from the
table row's "View pages" button. A real crawl commonly finds hundreds of
pages (the report that prompted this: 48 found on one source), and a side
sheet has no real room to search or manage that many rows well — it was
also the only place in this feature with no way to add a page manually
outside the one-time wizard. Replaced by
`agents/[agentTypeSlug]/knowledge/[sourceId]/page.tsx` +
`KnowledgeSourcePagesView.tsx`, a full page:

- `[sourceId]` is the `WebsiteSource.id` (what
  `KnowledgeSourceListItem.website_source_id` carries), not the parent
  `KnowledgeSource.id` — same id every other pages-scoped route already
  keyed on (see "`id` vs `website_source_id`" below). `KnowledgeSourcesTable`'s
  "View pages" button is now a `Link` to this route instead of local
  `pagesTarget` state, so `KnowledgeSourcesTable`/`KnowledgeSourcesView`
  gained an `agentTypeSlug` prop threaded down from `AgentDetailView` to
  build the URL.
- The page's own title/breadcrumb needs the source's `display_name`, which
  the pages endpoint doesn't carry. Rather than adding a per-source detail
  endpoint for one field, the view resolves it client-side from
  `useAllKnowledgeSources()` (already built for the knowledge-scope target
  picker) by matching `website_source_id` — a cheap lookup against an
  already-fetched org-wide list, not a new request.
  `KnowledgeSourcePagesPanel`'s permission gate (view-gated at the route
  level, following `AgentSettingsView`'s `noPermissionTitle`/
  `noPermissionDescription` pattern) moved here since there's no longer a
  parent panel-opener to gate.
- **Already-indexed pages sort first** (`STATUS_SORT_PRIORITY`:
  ready → failed → low_quality/duplicate → discovered), a client-side sort
  since the backend endpoint returns a plain `url`-ordered list with no
  sort/filter query params of its own (confirmed against
  `WebsiteDiscoveredUrlsView` — `page_size`/`page` only). Search is the same
  reason client-only: the full source is already loaded in one
  `page_size=500` call (see `useKnowledgeSourcePages`), so filtering the
  already-fetched array by `url.includes(query)` (mirroring
  `AddWebsiteDialog.tsx`'s review-step search, not the server-backed
  `useDebouncedSearch` the main sources list uses) needs no round trip.
- **Manual add** reuses the wizard review step's exact mechanism —
  `useKnowledgeSourcePages.addUrl(url)`, a bulk `PATCH .../discovered-urls/`
  with `{ add: [url] }` then a refetch — added to the hook rather than
  duplicated, gated on `knowledge:manage` (the wizard's own add flow is
  reachable only by someone who could already open it, i.e. `manage`).
- The "Recrawl selected" action is a `sticky bottom-4` bar within the page's
  own content column rather than `fixed` to the viewport — `fixed
inset-x-0` would span the app shell's sidebar too, which a page-scoped
  component has no business overlaying.

### Include/exclude and remove, and why "Indexed" was lying (2026-09-11)

A page reaches the index only when `status === 'ready'` **and**
`is_selected` — `_chunk_dicts_for_source` requires both. This view read
`is_selected` off the API and never rendered it, so a page that was crawled
and then excluded displayed a green "Indexed" badge while contributing
nothing to retrieval. That is the exact state behind a real report of two
pages that extracted successfully but never answered questions; the backend
half was fixed in `9f05390`, but the screen that made it invisible was not.

Three changes close it:

- An excluded page keeps its crawl-outcome badge but never a success tone
  (`ready` renders `neutral` when excluded), gains a warning "Excluded from
  the index" badge, and prints a plain explanation of what that means.
- The summary row counts excluded pages separately from status, since
  `ready` + excluded is the one combination that looks entirely healthy.
- Each row gains **Include**/**Exclude** and **Remove** actions
  (`knowledge:manage`), which the route shipped without: `select_ids`/
  `deselect_ids`/`remove_ids` existed in `DiscoveredUrlBulkActionInput` and
  were wired only in the wizard, so "select and update URLs" worked before
  the first extraction and nowhere after it. The two carry `title` text
  spelling out the difference (exclude keeps the crawled text and the row;
  remove deletes the row and forces rediscovery), the same way the wizard's
  checkbox-versus-X distinction is explained.

`useKnowledgeSourcePages` now **composes `useDiscoveredUrls`** instead of
re-reading the same endpoint itself. Both are views over one source's `Page`
rows, share `discoveredUrlsKey`, and need identical optimistic
include/exclude behaviour; keeping them as two independent hooks over the
same data is how this route shipped missing three actions the other one
already had. The recrawl mutation is the only thing left that is genuinely
this route's own.

### Reading a whole source in one call (2026-09-11)

Both surfaces load a source's full page list in a single request and then
filter/sort client-side. That request asked for `page_size=500`, but the
backend clamps to `DefaultPagination.max_page_size` (100) **silently** — so
the code read as "fetch everything" while not actually doing so. Harmless
today (a source tops out at 50 auto-discovered plus 25 manual pages), but it
would have truncated the list with no pagination control and no signal the
moment `MAX_AUTO_DISCOVERED_URLS` rose above 100. Now
`DISCOVERED_URLS_PAGE_SIZE` (100, asserted in the service test against that
ceiling), with `useDiscoveredUrls` exposing `isTruncated`/`total` from
`meta.count` and the pages view rendering a warning when a partial list is
on screen. Same pattern `useAllKnowledgeSources` already uses for the target
picker.

### `id` vs `website_source_id` (backend 2026-09-10 fix)

`KnowledgeSourceListItem.id` is the `KnowledgeSource` id, but every
website-scoped route (`discovered-urls/`, `extract/`, `recrawl/`,
`recrawl-pages/`) is keyed on `WebsiteSource.id` instead — a distinct UUID
behind a plain `OneToOneField`, not a shared primary key. Until 2026-09-10
`GET /knowledge/` never returned that second id at all, so the "Recrawl" and
"Manage pages" row actions were calling those routes with the wrong id
(404). Fixed by consuming the backend's new `website_source_id` field
(`null` for `pdf` sources): `KnowledgeSourcesTable` now derives a local
`websiteSourceId` per row and gates both actions' visibility on it being
non-null, passing it (not `source.id`) to `useKnowledgeSourceActions.recrawl`
and into `KnowledgeSourcePagesView`, which in turn passes it (not
`source.id`) to `useKnowledgeSourcePages`. The add-website wizard was never
affected by this bug — it gets the correct id from `CrawlJob.website_source`
in the discovery-job response, never from the list endpoint.

### Page outcomes: `low_quality` and `duplicate` (2026-09-10)

`PageStatus` had drifted: the backend added `low_quality` and `duplicate` in
its 2026-09-08 audit fix, and the frontend union still had only
`discovered`/`ready`/`failed`. Both are terminal, deliberate, _non-error_
outcomes of extraction — a page under `MIN_CONTENT_CHARS` after sanitization,
or one whose content exactly matches an already-`ready` page in the same
source, is skipped rather than producing near-empty or duplicate chunks.
Because they aren't failures, nothing in the UI mentioned them, so a page the
operator explicitly selected could come back from a "completed" extraction
with no error and simply never appear in the index, with no way to find out
why. `KnowledgeSourcePagesView` now badges every page's status through
`PAGE_STATUS_TONES` (warning, not danger, for these two) and prints a plain
explanation for the two whose reason isn't self-evident from the label.

### Per-page processing failures now surfaced (backend 2026-09-10)

The backend's `security-and-correctness-fixes-2026-09-10` branch replaced its
hand-rolled HTML text extractor with a Scrapling Markdown conversion pass and,
as part of that, fixed extraction failures so one bad page no longer aborts
the whole crawl job — a page whose content fails to convert now gets
`Page.status = 'failed'` with an `error_message`, while the rest of the job
keeps going. This makes a new, previously rare state common: a page can fetch
fine (`http_status: 200`) yet still end up `status: 'failed'`, which the
`http_status >= 400` danger badge in `KnowledgeSourcePagesView` didn't
account for. Fixed by badging `page.status` independently of `http_status`
(now via the `PAGE_STATUS_TONES` map described above) and rendering the
`error_message` text below the row, so a conversion failure is visible even
when the HTTP fetch itself succeeded. No other
change was needed on this branch: `WIDGET_POSITIONS`
(`src/lib/constants/agentTheme.ts`) already covered the new `top_left`/
`top_right` values, `WidgetPreview.tsx` already positions all four corners
correctly, nothing references the removed `PlatformSetting
.default_crawl_provider` field, and the `AgentService.update_draft`
partial-validation fix and the widget's own embedded chrome-text i18n table
are backend/embed-script internals with no API or type surface for this
frontend to mirror.

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

   **Duplicate source (backend 2026-09-11)**: `WebsiteDiscoveryService` now
   normalizes `root_url` and rejects a second source for the same
   organization+URL with a 409, `errors.code: "duplicate_website_source"`,
   `errors.existing_source_id` (a `KnowledgeSource.id`). The message itself
   still needs no special handling: `discover()`'s bare `applyApiError(error)`
   call (no `setError` passed) toasts the envelope's `message` verbatim when
   nothing binds to a field, and the backend's text for this code is already
   the full actionable sentence ("This website has already been added as a
   knowledge source. Use the existing source to recrawl or add more pages
   instead.").

   **`existing_source_id` is now read (2026-09-11).** It previously was not,
   because there was no URL-based route to a knowledge source to link to —
   the pages view opened as local `pagesTarget` state inside
   `KnowledgeSourcesTable.tsx`. The `[sourceId]` route removed that
   constraint, so `useAddWebsiteFlow` captures the id into
   `duplicateSourceId` (via `getErrorCode` + `getEnvelope`, both already
   exported) and `AddWebsiteDialog` renders a link straight to that source's
   pages. The id is a `KnowledgeSource.id` and the route is keyed on
   `WebsiteSource.id`, so the dialog resolves one to the other through
   `useAllKnowledgeSources()` — a lookup against an already-fetched org-wide
   list, not a new request — and renders nothing if it doesn't resolve. This
   is why `AddWebsiteDialog` takes an `agentTypeSlug` prop.

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
   `CrawlProgress` shows a ticking elapsed counter (`useElapsedSeconds` +
   `formatDuration`, seeded from `CrawlJob.created_at`) and states up front
   that a site without a usable sitemap is crawled link by link and can take
   ten minutes — see "Waiting-step feedback" below for why.
3. **review** — `useDiscoveredUrls.ts` lists
   `GET /knowledge/website/{id}/discovered-urls/` and toggles selection via
   `PATCH .../discovered-urls/` (`select_ids`/`deselect_ids`), one bulk call
   per checkbox rather than batched client-side — the list is small enough
   that this keeps selection state server-driven. Also wires the same
   endpoint's `add`/`remove_ids`: a text input above the list (`addUrl`)
   posts `{ add: [url] }` for a page outside what discovery found, and each
   row has a "Remove" button (`removeUrl`, `{ remove_ids: [id] }`) that
   drops the page outright — distinct from deselecting, which keeps the row
   visible but excludes it from extraction. The dialog is `max-w-2xl`
   (2026-09-10, widened from `max-w-lg`) and each URL wraps (`break-all`)
   instead of truncating with an ellipsis — a real crawl commonly discovers
   long, deeply-nested paths, and an operator deciding which pages to
   extract needs to read the full URL, not guess from a cut-off prefix.

   **Manual-add limit (backend 2026-09-11)**: a source can hold at most 25
   manually-added URLs; exceeding it 409s with
   `errors.code: "manual_url_limit_exceeded"`,
   `errors: { existing, requested, limit }`. No frontend change needed here
   either, for the same reason as the duplicate-source 409 above:
   `applyStructuralAction`'s bare `applyApiError(error)` already toasts the
   backend's message, which is composed server-side with the real
   `existing`/`requested`/`limit` numbers already interpolated. `addUrl`
   only ever sends one URL per call, so the sibling 400 (a single request's
   `add` array itself capped at 25) is unreachable from this UI.

   **Everything arrives pre-selected.** The backend's discovery task creates
   every `Page` with `is_selected=True`, so this list opens fully checked. That
   reads as "nothing is selected yet" to anyone expecting an opt-in list, and
   the reported symptom was an operator checking a single box, assuming that
   meant one page, and then waiting through an extraction of the whole site.
   Three things guard against it now: an "N of M selected" count above the
   list (it used to sit below every URL, off-screen for a long crawl), a
   notice pointing at "Deselect all" whenever the selection is still untouched
   and covers everything, and a page count on the extract button itself
   (`plural`), so the size of what is about to run is stated at the moment of
   committing. Above `SLOW_EXTRACTION_PAGE_COUNT` (25) it also warns that the
   run will be slow. None of this changes what is submitted — selection state
   stays server-side, one `PATCH` per toggle.

   **Review step layout (reworked 2026-09-10).** Ordered the way the decision
   is actually made: the selection summary, then the tools to narrow it, then
   the list, then commit. Specifics worth keeping:
   - The manual "add a URL" field used to sit _above_ the list, giving the
     rarest action on the screen the most prominent position. It is now below
     the list, introduced by a hint, where it reads as the exception it is.
   - A client-side search filters the list, and "Select all"/"Deselect all"
     re-label to "Select/Deselect matching" and scope themselves to the
     filtered ids while it is active. A "select all" that silently acted on
     rows the user had filtered out would be the opposite of what a filtered
     view implies.
   - Each row leads with the path and prints the origin muted beneath it.
     Every row in a single-site crawl repeats the same origin, so leading with
     it made 250 rows look identical. `splitUrl` falls back to the raw string
     for anything unparseable, e.g. a half-typed manual entry.
   - The checkbox and the row's X mean different things (skip for now versus
     drop from the list entirely), which nothing previously explained. The X
     now carries a `title` spelling out both, and an id-specific `aria-label`.

4. **extracting** — `POST /knowledge/website/{id}/extract/`, polled the same
   way as discovery, plus a real progress bar from `useExtractionProgress`.
5. **done** — `ExtractionSummary` reports the finished job's own
   `included_count`/`failed_count`/`excluded_count` (zero-valued rows omitted)
   and points at "View pages" for anything more detailed. This step used to
   say only "the selected pages have been queued for indexing", with no
   numbers at all, so there was no way to tell whether 3 pages or 300 had made
   it in, or that any had failed. The knowledge sources list is invalidated
   here so the new source shows up with its post-extraction status.

### Selection is optimistic (2026-09-10)

`useDiscoveredUrls` patches the cached row and drops the refetch rather than
awaiting `PATCH` + a full re-read before the checkbox moves. On a real crawl
that was a round trip plus a 250-row refetch per click, so boxes appeared not
to respond and users clicked them again. Rollback restores the previous cache
entry and surfaces the error, so the list can never silently disagree with the
server. `add`/`remove_ids` still refetch: both change which rows exist, and the
server assigns the id of anything added, so there is nothing to patch in.

`selectAll`/`deselectAll` were replaced by `selectMany`/`deselectMany` taking
explicit ids, so the caller decides whether an action means the whole crawl or
just the filtered view.

### Waiting-step feedback (2026-09-10)

Both polling steps used to render a bare spinner and one line of "this can
take a moment" copy. Discovery routinely runs to the backend's
`MAX_CRAWL_JOB_SECONDS` (600) ceiling on a site whose sitemap isn't usable,
and extraction is one fetch plus one embedding call per page, so multi-minute
waits are normal and were repeatedly reported as the app being stuck. The
three additions are all frontend-only:

- **Elapsed time** (`useElapsedSeconds`, `formatDuration`): a ticking value is
  the cheapest honest proof that something is still running, and needs nothing
  from the API. `formatDuration` is deliberately separate from
  `formatRelativeTime` — the latter collapses to a flat "2 minutes ago" that
  stops visibly moving, which is the opposite of what a progress readout needs.
- **Extraction progress** (`useExtractionProgress`): `CrawlJob.included_count`/
  `failed_count` would be the natural source but `extract_selected_pages`
  writes them only once, after its loop — they read `0` for the entire run,
  exactly the window a progress indicator exists for. Individual `Page.status`
  values _are_ saved per page as it's processed, so the hook counts selected
  pages that have left `discovered` and derives an honest fraction. It shares
  `discoveredUrlsKey` with `useDiscoveredUrls` (no duplicate fetch) and is
  gated to the extracting step, since it's a `page_size=500` read every 5s.
  Delete it in favour of the job counters if the backend ever reports them
  incrementally.
- **"You can close this"**: closing mid-run drops every id the flow holds, and
  the review step is only reachable from inside this dialog, so an accidental
  dismiss during a ten-minute discovery strands a source that's still being
  crawled. The run is safe (it finishes server-side, the source is already
  saved), so `requestClose` confirms via `AlertDialog` rather than blocking.

Both failure steps now render the job's own `error_summary` when the backend
sent one, falling back to the generic copy — previously the real reason was
fetched, held in state, and thrown away.

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
`POST /agents/{id}/knowledge/build-index/`, gated `knowledge:execute`.
Publishing no longer requires a `ready` index at all (backend dropped
`_assert_index_ready` 2026-09-09, `AgentMessages.INDEX_NOT_READY` and its
`code="index_not_ready"` are gone) — this panel is purely informational now,
not a publish blocker.

**Auto-refresh (2026-09-11)**: extraction (`_trigger_index_rebuild_for_source_safely`,
called by both `extract_selected_pages` and `recrawl-pages/`) enqueues a
background `build_index_version` for every agent the source feeds, without
the operator ever calling `build-index/` themselves. Before this fix, the
frontend never learned this happened: `useAddWebsiteFlow.ts`'s
`onExtractionFinished` only invalidated `knowledgeSourcesListKey()`, leaving
`discoveredUrlsKey` (the "View pages" panel), `indexVersionsListKey`, and
`knowledgeHealthKey` all showing their pre-extraction snapshot until a full
page reload. Same gap in `useKnowledgeSourcePages.ts`'s `recrawlPagesMutation`
(recrawl-pages is the same underlying trigger). Both now also invalidate the
index-versions and health caches; since the resulting build itself finishes
asynchronously, `useIndexVersions` polls (5s) while the newest version
(`versions[0]`, list is `-version_number` ordered) is `building`, and
invalidates `knowledgeHealthKey` the moment it leaves that state, so the
health widget's `indexed_chunks`/`score` catch up automatically rather than
staying pinned to the pre-build numbers.

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

## Enable/disable a source (2026-09-11, backend audit fix B9)

`KnowledgeSourcesTable.tsx`'s overflow menu now has a Disable/Enable item
(`useKnowledgeSourceActions.ts`'s `disable`/`enable`, `POST
knowledge/sources/{id}/{disable,enable}/`), gated `knowledge:manage` same as
rename/delete. Toggles the existing `status: 'disabled'` enum value the
frontend type already carried but no action ever set. No new status tone
needed: `KnowledgeSourcesTable.tsx`'s `STATUS_TONE` map already had a
`disabled: 'neutral'` entry from before this action existed.

Re-enabling restores `ready` or `pending` server-side depending on whether
the source has indexed chunks already — the list simply reflects whatever
`status` the response returns after `invalidate()`, no client-side guessing
of which one it'll be.

Also from B6 in the same audit fix: `get_health_summary`'s `score` can now
read `0` for a `ready` source with zero indexed chunks (previously it read
100%, which was the bug). Checked `KnowledgeHealthPanel.tsx` — it only
special-cases `sources === 0` as a dash; a nonzero `sources` with `score: 0`
already renders as a plain `0/100`, which is now the correct, intended
reading. No change needed.

## Editing a website source's crawl config after creation — blocked on a

## backend read gap (2026-09-11, backend audit fix B8)

The backend audit fix added `PATCH knowledge/website/{id}/config/`
(`WebsiteSourceConfigUpdateSerializer`) so `scope_config`/
`recrawl_interval_hours` are no longer write-once. It's a **full replace,
not a merge** — a request sending only one key overwrites the whole object,
by deliberate product decision (documented in that serializer's own
docstring), not a bug.

**Not wired up on the frontend.** Building an edit dialog for a full-replace
field requires pre-filling it with the _current_ config, or an operator who
edits just one field silently wipes every other `scope_config` key they
forgot was set. Checked every read path a website source detail could come
from — `KnowledgeSourceDetailView.GET` (`KnowledgeSourceSerializer`),
`KnowledgeSourceListSerializer`, the discovered-urls list — none of them,
nor any other route, return a `WebsiteSource`'s `scope_config` or
`recrawl_interval_hours` once creation is past. The PATCH endpoint's own
response only echoes back what was just written, not what a fresh page load
would need to show first. There is currently no safe way to build this UI.
Flagged for the backend team: needs either a `scope_config`/
`recrawl_interval_hours` field added to `KnowledgeSourceSerializer` (or a
website-source-scoped GET), before this can be built.

## Route protection

No new `ROUTE_PERMISSIONS` entry — `{ prefix: '/agents', resources: ['agent']
}` already covers every `/agents/[agentId]/**` route at the "can view an
agent at all" level, matching how the agent detail page's Draft/Publish tabs
are already gated at the component level despite sharing one route. Finer
`knowledge:{view,manage,execute}` checks live in the components above via
`usePermissions().can()`.
