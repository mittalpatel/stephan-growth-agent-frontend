/**
 * Knowledge endpoints and query keys.
 *
 * Same shape as `src/services/agents.ts`. Unlike agents, the source-list
 * endpoint has no `?type=parameters` route wired up on the backend even
 * though its selector builds one (`KnowledgeSourceSelector.build_parameters_config`)
 * — the view never calls it. `KNOWLEDGE_SOURCE_FILTER_OPTIONS` below mirrors
 * that selector's static config by hand so the list page can still offer
 * status/type filters without a parameters round trip.
 */
import { buildListParams, type ListQuery } from './listParams';

export const agentKnowledgeSourcesEndpoint = (agentId: string) =>
  `/api/v1/agents/${agentId}/knowledge/sources/`;
export const agentWebsiteDiscoverEndpoint = (agentId: string) =>
  `/api/v1/agents/${agentId}/knowledge/website/discover/`;
export const agentPdfUploadEndpoint = (agentId: string) =>
  `/api/v1/agents/${agentId}/knowledge/pdfs/`;
export const agentCrawlJobDetailEndpoint = (agentId: string, jobId: string) =>
  `/api/v1/agents/${agentId}/knowledge/crawl-jobs/${jobId}/`;
export const agentBuildIndexEndpoint = (agentId: string) =>
  `/api/v1/agents/${agentId}/knowledge/build-index/`;
export const agentIndexVersionsEndpoint = (agentId: string) =>
  `/api/v1/agents/${agentId}/knowledge/index-versions/`;

export const knowledgeSourceDetailEndpoint = (sourceId: string) =>
  `/api/v1/knowledge/sources/${sourceId}/`;
export const knowledgeSourceReprocessEndpoint = (sourceId: string) =>
  `/api/v1/knowledge/sources/${sourceId}/reprocess/`;

export const websiteDiscoveredUrlsEndpoint = (websiteSourceId: string) =>
  `/api/v1/knowledge/website/${websiteSourceId}/discovered-urls/`;
export const websiteExtractEndpoint = (websiteSourceId: string) =>
  `/api/v1/knowledge/website/${websiteSourceId}/extract/`;
export const websiteRecrawlEndpoint = (websiteSourceId: string) =>
  `/api/v1/knowledge/website/${websiteSourceId}/recrawl/`;

export const KNOWLEDGE_SOURCES_LIST_KEY = 'knowledge-sources-list';
export const INDEX_VERSIONS_LIST_KEY = 'index-versions-list';

export const knowledgeSourcesListKey = (agentId: string) => [KNOWLEDGE_SOURCES_LIST_KEY, agentId];
export const indexVersionsListKey = (agentId: string) => [INDEX_VERSIONS_LIST_KEY, agentId];
export const crawlJobKey = (agentId: string, jobId: string) => ['crawl-job', agentId, jobId];
export const discoveredUrlsKey = (websiteSourceId: string) => ['discovered-urls', websiteSourceId];

export type KnowledgeSourceListQuery = ListQuery;
export const buildKnowledgeSourceListParams = buildListParams;

export function knowledgeSourcesListUrl(agentId: string, query: KnowledgeSourceListQuery): string {
  const search = new URLSearchParams(
    Object.entries(buildKnowledgeSourceListParams(query)).map(([key, value]) => [
      key,
      String(value),
    ])
  );
  return `${agentKnowledgeSourcesEndpoint(agentId)}?${search.toString()}`;
}

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
