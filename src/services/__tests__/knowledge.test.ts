import { describe, it, expect } from 'vitest';

import {
  agentBuildIndexEndpoint,
  agentCrawlJobDetailEndpoint,
  agentIndexVersionsEndpoint,
  agentKnowledgeSourcesEndpoint,
  agentPdfUploadEndpoint,
  agentWebsiteDiscoverEndpoint,
  crawlJobKey,
  discoveredUrlsKey,
  indexVersionsListKey,
  knowledgeSourceDetailEndpoint,
  knowledgeSourceReprocessEndpoint,
  knowledgeSourcesListKey,
  knowledgeSourcesListUrl,
  websiteDiscoveredUrlsEndpoint,
  websiteExtractEndpoint,
  websiteRecrawlEndpoint,
} from '../knowledge';

const AGENT_ID = '0c2f6a1e-1111-4a2b-8c3d-4e5f60718293';
const SOURCE_ID = 'a1b2c3d4-2222-4a2b-8c3d-4e5f60718293';
const WEBSITE_SOURCE_ID = 'b1c2d3e4-3333-4a2b-8c3d-4e5f60718293';
const JOB_ID = 'c1d2e3f4-4444-4a2b-8c3d-4e5f60718293';

describe('knowledge endpoints', () => {
  it('nests the agent id in every agent-scoped endpoint', () => {
    expect(agentKnowledgeSourcesEndpoint(AGENT_ID)).toBe(
      `/api/v1/agents/${AGENT_ID}/knowledge/sources/`
    );
    expect(agentWebsiteDiscoverEndpoint(AGENT_ID)).toBe(
      `/api/v1/agents/${AGENT_ID}/knowledge/website/discover/`
    );
    expect(agentPdfUploadEndpoint(AGENT_ID)).toBe(`/api/v1/agents/${AGENT_ID}/knowledge/pdfs/`);
    expect(agentCrawlJobDetailEndpoint(AGENT_ID, JOB_ID)).toBe(
      `/api/v1/agents/${AGENT_ID}/knowledge/crawl-jobs/${JOB_ID}/`
    );
    expect(agentBuildIndexEndpoint(AGENT_ID)).toBe(
      `/api/v1/agents/${AGENT_ID}/knowledge/build-index/`
    );
    expect(agentIndexVersionsEndpoint(AGENT_ID)).toBe(
      `/api/v1/agents/${AGENT_ID}/knowledge/index-versions/`
    );
  });

  it('nests the source id in source-scoped endpoints', () => {
    expect(knowledgeSourceDetailEndpoint(SOURCE_ID)).toBe(
      `/api/v1/knowledge/sources/${SOURCE_ID}/`
    );
    expect(knowledgeSourceReprocessEndpoint(SOURCE_ID)).toBe(
      `/api/v1/knowledge/sources/${SOURCE_ID}/reprocess/`
    );
  });

  it('nests the website source id in website-scoped endpoints', () => {
    expect(websiteDiscoveredUrlsEndpoint(WEBSITE_SOURCE_ID)).toBe(
      `/api/v1/knowledge/website/${WEBSITE_SOURCE_ID}/discovered-urls/`
    );
    expect(websiteExtractEndpoint(WEBSITE_SOURCE_ID)).toBe(
      `/api/v1/knowledge/website/${WEBSITE_SOURCE_ID}/extract/`
    );
    expect(websiteRecrawlEndpoint(WEBSITE_SOURCE_ID)).toBe(
      `/api/v1/knowledge/website/${WEBSITE_SOURCE_ID}/recrawl/`
    );
  });

  it('builds distinct query keys per id', () => {
    expect(knowledgeSourcesListKey(AGENT_ID)).toEqual(['knowledge-sources-list', AGENT_ID]);
    expect(indexVersionsListKey(AGENT_ID)).toEqual(['index-versions-list', AGENT_ID]);
    expect(crawlJobKey(AGENT_ID, JOB_ID)).toEqual(['crawl-job', AGENT_ID, JOB_ID]);
    expect(discoveredUrlsKey(WEBSITE_SOURCE_ID)).toEqual(['discovered-urls', WEBSITE_SOURCE_ID]);
  });

  it('encodes list params onto the agent-nested list endpoint', () => {
    const url = knowledgeSourcesListUrl(AGENT_ID, {
      page: 2,
      limit: 25,
      search: [],
      search_by: '',
      sort: 'display_name',
      sort_direction: 'asc',
      filter: [],
      filter_by: [],
    });
    expect(url).toContain(agentKnowledgeSourcesEndpoint(AGENT_ID));
    expect(url).toContain('page=2');
    expect(url).toContain('page_size=25');
    expect(url).toContain('sort=display_name');
    expect(url).toContain('sort_direction=asc');
  });
});
