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

/** Mirrors `PageStatus` in `apps/knowledge/constants.py`. */
export type PageStatus = 'discovered' | 'ready' | 'failed';

/** Mirrors `PageDiscoverySource` in `apps/knowledge/constants.py`. */
export type PageDiscoverySource = 'sitemap' | 'robots_crawl' | 'fallback_link_scan' | 'manual';

/** Mirrors `IndexVersionStatus` in `apps/knowledge/constants.py`. */
export type IndexVersionStatus = 'building' | 'ready' | 'failed';

/**
 * Row shape from `GET /knowledge/`. No `agent` field: as of the backend's
 * 2026-09-06 change a source belongs to the organization, and an agent
 * narrows to a subset of them via `AgentKnowledgeTarget` instead of owning
 * any.
 */
export type KnowledgeSourceListItem = {
  id: string;
  source_type: KnowledgeSourceType;
  status: KnowledgeSourceStatus;
  display_name: string;
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
};

/** Response of `POST /knowledge/website/discover/`. */
export type WebsiteDiscoverResult = {
  source: KnowledgeSource;
  crawl_job: CrawlJob;
};

/** Row shape from `GET /knowledge/website/{id}/discovered-urls/`. */
export type DiscoveredUrl = {
  id: string;
  url: string;
  canonical_url: string | null;
  discovery_source: PageDiscoverySource;
  is_selected: boolean;
  status: PageStatus;
  error_message: string;
  fetched_at: string | null;
};

/** Body for `PATCH /knowledge/website/{id}/discovered-urls/`. */
export type DiscoveredUrlBulkActionInput = Partial<{
  add: string[];
  remove_ids: string[];
  select_ids: string[];
  deselect_ids: string[];
}>;

/** `CrawlJobSerializer` — one discovery or extraction run. */
export type CrawlJob = {
  id: string;
  website_source: string;
  job_type: CrawlJobType;
  status: CrawlJobStatus;
  discovered_count: number;
  included_count: number;
  excluded_count: number;
  failed_count: number;
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
