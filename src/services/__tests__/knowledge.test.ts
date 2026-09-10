import { describe, it, expect } from 'vitest';

import {
  agentBuildIndexEndpoint,
  agentCrawlJobDetailEndpoint,
  agentIndexVersionsEndpoint,
  agentKnowledgeHealthEndpoint,
  agentKnowledgeTargetsEndpoint,
  crawlJobKey,
  discoveredUrlsKey,
  indexVersionsListKey,
  knowledgeSourceDetailEndpoint,
  knowledgeSourceReprocessEndpoint,
  KNOWLEDGE_PDF_UPLOAD_ENDPOINT,
  KNOWLEDGE_SOURCES_ENDPOINT,
  KNOWLEDGE_WEBSITE_DISCOVER_ENDPOINT,
  knowledgeSourcesListKey,
  knowledgeSourcesListUrl,
  knowledgeTargetsKey,
  websiteDiscoveredUrlsEndpoint,
  websiteExtractEndpoint,
  websiteRecrawlEndpoint,
  websiteRecrawlPagesEndpoint,
} from '../knowledge';

const AGENT_ID = '0c2f6a1e-1111-4a2b-8c3d-4e5f60718293';
const SOURCE_ID = 'a1b2c3d4-2222-4a2b-8c3d-4e5f60718293';
const WEBSITE_SOURCE_ID = 'b1c2d3e4-3333-4a2b-8c3d-4e5f60718293';
const JOB_ID = 'c1d2e3f4-4444-4a2b-8c3d-4e5f60718293';

describe('knowledge endpoints', () => {
  // Creation and listing are org-level as of the backend's 2026-09-06
  // change; an agent id appears only where the route is genuinely
  // agent-specific. Asserted explicitly because getting this backwards is
  // silent at compile time and 404s at runtime.
  it('keeps source creation and listing off the agent prefix', () => {
    expect(KNOWLEDGE_SOURCES_ENDPOINT).toBe('/api/v1/knowledge/');
    expect(KNOWLEDGE_WEBSITE_DISCOVER_ENDPOINT).toBe('/api/v1/knowledge/website/discover/');
    expect(KNOWLEDGE_PDF_UPLOAD_ENDPOINT).toBe('/api/v1/knowledge/pdfs/');
    for (const endpoint of [
      KNOWLEDGE_SOURCES_ENDPOINT,
      KNOWLEDGE_WEBSITE_DISCOVER_ENDPOINT,
      KNOWLEDGE_PDF_UPLOAD_ENDPOINT,
    ]) {
      expect(endpoint).not.toContain('/agents/');
    }
  });

  it('nests the agent id in every agent-scoped endpoint', () => {
    expect(agentKnowledgeTargetsEndpoint(AGENT_ID)).toBe(
      `/api/v1/agents/${AGENT_ID}/knowledge/targets/`
    );
    expect(agentKnowledgeHealthEndpoint(AGENT_ID)).toBe(
      `/api/v1/agents/${AGENT_ID}/knowledge/health/`
    );
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
    expect(websiteRecrawlPagesEndpoint(WEBSITE_SOURCE_ID)).toBe(
      `/api/v1/knowledge/website/${WEBSITE_SOURCE_ID}/recrawl-pages/`
    );
  });

  it('builds distinct query keys per id', () => {
    // No agent id: one org-wide list, so a source added from any agent's
    // page invalidates the entry every other agent reads.
    expect(knowledgeSourcesListKey()).toEqual(['knowledge-sources-list']);
    expect(knowledgeTargetsKey(AGENT_ID)).toEqual(['knowledge-targets', AGENT_ID]);
    expect(indexVersionsListKey(AGENT_ID)).toEqual(['index-versions-list', AGENT_ID]);
    expect(crawlJobKey(AGENT_ID, JOB_ID)).toEqual(['crawl-job', AGENT_ID, JOB_ID]);
    expect(discoveredUrlsKey(WEBSITE_SOURCE_ID)).toEqual(['discovered-urls', WEBSITE_SOURCE_ID]);
  });

  it('encodes list params onto the org-level list endpoint', () => {
    const url = knowledgeSourcesListUrl({
      page: 2,
      limit: 25,
      search: [],
      search_by: '',
      sort: 'display_name',
      sort_direction: 'asc',
      filter: [],
      filter_by: [],
    });
    expect(url).toContain(KNOWLEDGE_SOURCES_ENDPOINT);
    expect(url).toContain('page=2');
    expect(url).toContain('page_size=25');
    expect(url).toContain('sort=display_name');
    expect(url).toContain('sort_direction=asc');
  });
});
