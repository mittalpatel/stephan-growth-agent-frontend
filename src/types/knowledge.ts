/**
 * Knowledge DTOs — mirrors `apps/knowledge/api/v1/serializers/knowledge.py`
 * field for field. Names match the backend exactly (`snake_case`).
 */

/** Mirrors `KnowledgeSourceType` in `apps/knowledge/constants.py`. */
export type KnowledgeSourceType = 'website' | 'pdf';

/** Mirrors `KnowledgeSourceStatus` in `apps/knowledge/constants.py`. */
export type KnowledgeSourceStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'disabled';

/** Mirrors `CrawlJobType` in `apps/knowledge/constants.py`. */
export type CrawlJobType = 'discovery' | 'extraction';

/** Mirrors `CrawlJobStatus` in `apps/knowledge/constants.py`. */
export type CrawlJobStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Mirrors `PageStatus` in `apps/knowledge/constants.py`.
 *
 * `low_quality`/`duplicate` are terminal, non-`ready` outcomes of extraction
 * and deliberately not errors: a page below the backend's `MIN_CONTENT_CHARS`
 * after sanitization, or one whose content exactly matches an already-`ready`
 * page in the same source, is excluded from indexing rather than producing
 * near-empty or duplicate chunks. They still need surfacing, since to an
 * operator they otherwise look like a page that was selected, reported no
 * error, and silently never made it into the index.
 */
export type PageStatus = 'discovered' | 'ready' | 'failed' | 'low_quality' | 'duplicate';

/** Mirrors `PageDiscoverySource` in `apps/knowledge/constants.py`. */
export type PageDiscoverySource = 'sitemap' | 'robots_crawl' | 'fallback_link_scan' | 'manual';

/** Mirrors `IndexVersionStatus` in `apps/knowledge/constants.py`. */
export type IndexVersionStatus = 'building' | 'ready' | 'failed';

/** `IndexBuildFailure`: the build step that failed; empty unless `failed`. */
export type IndexBuildFailure = '' | 'embedding' | 'vector_store' | 'saving' | 'unexpected';

/**
 * Row shape from `GET /knowledge/`. No `agent` field: as of the backend's
 * 2026-09-06 change a source belongs to the organization, and an agent
 * narrows to a subset of them via `AgentKnowledgeTarget` instead of owning
 * any.
 *
 * `id` is the `KnowledgeSource` id — distinct from `website_source_id`
 * (backend 2026-09-10), which is `WebsiteSource.id` behind a plain
 * `OneToOneField`, not a shared primary key. Every website-scoped route
 * (`discovered-urls/`, `extract/`, `recrawl/`, `recrawl-pages/`) is keyed on
 * the latter, so any action on an already-listed row must use
 * `website_source_id`, never `id`. `null` for a `pdf` source, which has no
 * `WebsiteSource` row at all.
 */
/** Mirrors `SourceProgressStage` in `apps/knowledge/constants.py`. */
export type SourceProgressStage = 'waiting' | 'finding' | 'choosing' | 'reading';

/**
 * Where an in-progress source is (backend 2026-10-13). `null` on the row once
 * it is ready, failed or disabled. Counts are `null` where the backend has
 * none to give: a PDF reports no page counts, and `pages_done` exists only
 * while reading.
 */
export type SourceProgress = {
  stage: SourceProgressStage;
  pages_found: number | null;
  pages_done: number | null;
  pages_total: number | null;
};

export type KnowledgeSourceListItem = {
  id: string;
  source_type: KnowledgeSourceType;
  status: KnowledgeSourceStatus;
  display_name: string;
  website_source_id: string | null;
  /** The site address of a website source; null for a PDF. */
  website_root_url: string | null;
  progress: SourceProgress | null;
  created_at: string;
  updated_at: string;
};

/** Full record shape — response of the discover/pdf-upload/detail endpoints. */
export type KnowledgeSource = {
  id: string;
  source_type: KnowledgeSourceType;
  status: KnowledgeSourceStatus;
  display_name: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Body for `PATCH /knowledge/sources/{id}/`. */
export type KnowledgeSourceUpdateInput = { display_name: string };

/** Body for `POST /knowledge/website/discover/`. */
export type WebsiteDiscoverInput = {
  root_url: string;
  scope_config?: Record<string, unknown>;
  /** Read every found page without a review step. The backend defaults to `false`. */
  auto_extract?: boolean;
};

/** Response of `POST /knowledge/website/discover/`. */
export type WebsiteDiscoverResult = {
  source: KnowledgeSource;
  crawl_job: CrawlJob;
};

/**
 * Row shape from `GET /knowledge/website/{id}/discovered-urls/`.
 *
 * `content_changed_at`, `http_status`, `content_hash` (backend
 * 2026-09-09's recrawl pipeline fix) let a page-management view show why a
 * page might need recrawling without triggering one blind.
 */
export type DiscoveredUrl = {
  id: string;
  url: string;
  canonical_url: string | null;
  discovery_source: PageDiscoverySource;
  is_selected: boolean;
  status: PageStatus;
  error_message: string;
  fetched_at: string | null;
  content_changed_at: string | null;
  http_status: number | null;
  content_hash: string | null;
  /** Why the page was left out of the index; `''` when it was not. */
  exclusion_reason: PageExclusionReason | '';
};

/** Mirrors `PageExclusionReason` in `apps/knowledge/constants.py`. */
export type PageExclusionReason =
  | 'media'
  | 'duplicate'
  | 'low_content'
  | 'robots'
  | 'path_filter'
  | 'not_fetched';

/** Body for `PATCH /knowledge/website/{id}/discovered-urls/`. */
export type DiscoveredUrlBulkActionInput = Partial<{
  add: string[];
  remove_ids: string[];
  select_ids: string[];
  deselect_ids: string[];
}>;

/** Body for `POST /knowledge/website/{id}/recrawl-pages/`. */
export type RecrawlPagesInput = { page_ids: string[] };

/**
 * `CrawlJobSerializer` — one discovery or extraction run.
 *
 * `removed_count`/`requeued_count` (backend 2026-09-09) surface the recrawl
 * pipeline's page-removal-detection and selective-recrawl outcomes.
 */
export type CrawlJob = {
  id: string;
  website_source: string;
  job_type: CrawlJobType;
  status: CrawlJobStatus;
  discovered_count: number;
  included_count: number;
  excluded_count: number;
  failed_count: number;
  removed_count: number;
  requeued_count: number;
  auto_extract: boolean;
  error_summary: string;
  created_at: string;
  updated_at: string;
};

/** `IndexVersionSerializer` — one index build. */
export type IndexVersion = {
  id: string;
  agent: string;
  version_number: number;
  status: IndexVersionStatus;
  chunk_count: number;
  failure_reason: IndexBuildFailure;
  built_at: string | null;
  created_at: string;
};

/**
 * `AgentKnowledgeTargetSerializer` — one row of an agent's narrowing set.
 * `source` is the `KnowledgeSource` id, not an embedded object.
 */
export type AgentKnowledgeTarget = {
  id: string;
  source: string;
  created_at: string;
};

/**
 * Response of `GET`/`PUT /agents/{id}/knowledge/targets/`.
 *
 * `is_narrowed` is the backend's own derived flag and is the meaningful bit:
 * no target rows means the agent reads the org's entire shared knowledge
 * layer, which is a different state from "narrowed to nothing" being
 * impossible to express. Sending an empty `source_ids` is how an agent is
 * explicitly un-narrowed.
 */
export type AgentKnowledgeTargets = {
  targets: AgentKnowledgeTarget[];
  is_narrowed: boolean;
};

/** Body for `PUT /agents/{id}/knowledge/targets/` — replaces the whole set. */
export type AgentKnowledgeTargetSetInput = { source_ids: string[] };

/** A crawl job is done polling once it leaves these two states. */
export const CRAWL_JOB_ACTIVE_STATUSES: readonly CrawlJobStatus[] = ['pending', 'running'];

/** `GET /knowledge/upload-limits/`: what a PDF upload is checked against. */
export type KnowledgeUploadLimits = {
  max_pdf_size_mb: number;
  max_pdf_pages: number;
  /** The most pages one website read finds on this organization's plan. */
  max_discovered_pages: number;
};
