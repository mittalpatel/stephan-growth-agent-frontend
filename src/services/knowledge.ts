/**
 * Knowledge endpoints and query keys.
 *
 * `KnowledgeSource` is org-shared as of the backend's 2026-09-06 change: a
 * crawl or PDF belongs to the organization, not to one agent. Creation and
 * listing therefore hang off the plain `knowledge/` prefix, and an agent id
 * appears only on the routes that are genuinely agent-specific — its
 * narrowing `targets/`, its own index builds, its crawl-job lookups, and its
 * health summary. See `apps/knowledge/api/v1/urls.py`.
 *
 * The source-list endpoint still has no `?type=parameters` route wired up
 * even though its selector builds one (`KnowledgeSourceSelector.build_parameters_config`)
 * — the view never calls it. `KNOWLEDGE_SOURCE_FILTER_OPTIONS` below mirrors
 * that selector's static config by hand so the list page can still offer
 * status/type filters without a parameters round trip.
 */
import { buildListParams, type ListQuery } from './listParams';

/** Org-level: shared by every agent in the tenant. */
export const KNOWLEDGE_SOURCES_ENDPOINT = '/api/v1/knowledge/';
export const KNOWLEDGE_WEBSITE_DISCOVER_ENDPOINT = '/api/v1/knowledge/website/discover/';
export const KNOWLEDGE_PDF_UPLOAD_ENDPOINT = '/api/v1/knowledge/pdfs/';

/** Agent-scoped: the routes that genuinely need one agent's context. */
export const agentKnowledgeTargetsEndpoint = (agentId: string) =>
  `/api/v1/agents/${agentId}/knowledge/targets/`;
export const agentCrawlJobDetailEndpoint = (agentId: string, jobId: string) =>
  `/api/v1/agents/${agentId}/knowledge/crawl-jobs/${jobId}/`;
export const agentBuildIndexEndpoint = (agentId: string) =>
  `/api/v1/agents/${agentId}/knowledge/build-index/`;
export const agentIndexVersionsEndpoint = (agentId: string) =>
  `/api/v1/agents/${agentId}/knowledge/index-versions/`;
export const agentKnowledgeHealthEndpoint = (agentId: string) =>
  `/api/v1/agents/${agentId}/knowledge/health/`;

export const knowledgeSourceDetailEndpoint = (sourceId: string) =>
  `/api/v1/knowledge/sources/${sourceId}/`;
export const knowledgeSourceReprocessEndpoint = (sourceId: string) =>
  `/api/v1/knowledge/sources/${sourceId}/reprocess/`;
export const knowledgeSourceDisableEndpoint = (sourceId: string) =>
  `/api/v1/knowledge/sources/${sourceId}/disable/`;
export const knowledgeSourceEnableEndpoint = (sourceId: string) =>
  `/api/v1/knowledge/sources/${sourceId}/enable/`;

export const websiteDiscoveredUrlsEndpoint = (websiteSourceId: string) =>
  `/api/v1/knowledge/website/${websiteSourceId}/discovered-urls/`;
export const websiteExtractEndpoint = (websiteSourceId: string) =>
  `/api/v1/knowledge/website/${websiteSourceId}/extract/`;
export const websiteRecrawlEndpoint = (websiteSourceId: string) =>
  `/api/v1/knowledge/website/${websiteSourceId}/recrawl/`;
export const websiteRecrawlPagesEndpoint = (websiteSourceId: string) =>
  `/api/v1/knowledge/website/${websiteSourceId}/recrawl-pages/`;
export const websiteSourceConfigEndpoint = (websiteSourceId: string) =>
  `/api/v1/knowledge/website/${websiteSourceId}/config/`;

export const KNOWLEDGE_SOURCES_LIST_KEY = 'knowledge-sources-list';
export const INDEX_VERSIONS_LIST_KEY = 'index-versions-list';
export const KNOWLEDGE_HEALTH_KEY = 'knowledge-health';

/**
 * No agent id in the key: one org-wide list, so a source added from any
 * agent's page invalidates the same cache entry every other agent reads.
 */
export const knowledgeSourcesListKey = () => [KNOWLEDGE_SOURCES_LIST_KEY];
export const indexVersionsListKey = (agentId: string) => [INDEX_VERSIONS_LIST_KEY, agentId];
export const knowledgeHealthKey = (agentId: string) => [KNOWLEDGE_HEALTH_KEY, agentId];
export const knowledgeTargetsKey = (agentId: string) => ['knowledge-targets', agentId];
export const crawlJobKey = (agentId: string, jobId: string) => ['crawl-job', agentId, jobId];
export const discoveredUrlsKey = (websiteSourceId: string) => ['discovered-urls', websiteSourceId];

export type KnowledgeSourceListQuery = ListQuery;
export const buildKnowledgeSourceListParams = buildListParams;

export function knowledgeSourcesListUrl(query: KnowledgeSourceListQuery): string {
  const search = new URLSearchParams(
    Object.entries(buildKnowledgeSourceListParams(query)).map(([key, value]) => [
      key,
      String(value),
    ])
  );
  return `${KNOWLEDGE_SOURCES_ENDPOINT}?${search.toString()}`;
}

/**
 * One page big enough to hold an org's whole shared knowledge layer in the
 * target picker, which has to show every source at once to be usable.
 * `DefaultPagination.max_page_size` is 100, so this is the ceiling, not a
 * preference — the picker reports the shortfall rather than silently
 * truncating if an org ever exceeds it.
 */
export const KNOWLEDGE_TARGET_PICKER_PAGE_SIZE = 100;

/**
 * One max-size page of a website source's pages, matching the backend's
 * `DefaultPagination.max_page_size`. Both page surfaces (the wizard's review
 * step and the dedicated pages route) read the whole source in one call and
 * filter/sort client-side, so this has to be a real ceiling rather than an
 * optimistic one: a larger number is silently clamped to 100 server-side, which
 * would truncate the list with no pagination control and no way to tell. A
 * source tops out at 50 auto-discovered plus 25 manually added pages today, so
 * this fits with headroom, and callers surface `isTruncated` if that ever
 * changes.
 */
export const DISCOVERED_URLS_PAGE_SIZE = 100;

/** Must be a subset of the searchable fields in `KnowledgeSourceSelector`. */
export const KNOWLEDGE_SOURCE_SEARCH_COLUMNS = ['display_name'];

/**
 * The `status`/`source_type` values `KnowledgeSourceSelector._FILTER_FIELDS`
 * accepts. The view never exposes `build_parameters_config()` over
 * `?type=parameters`, so `useKnowledgeSources` builds its `FilterConfig[]`
 * from these value lists plus locale labels, rather than fetching them.
 */
export const KNOWLEDGE_SOURCE_STATUS_VALUES = [
  'pending',
  'processing',
  'ready',
  'failed',
  'disabled',
] as const;
export const KNOWLEDGE_SOURCE_TYPE_VALUES = ['website', 'pdf'] as const;
