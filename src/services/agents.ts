/**
 * Agent endpoints and query keys.
 *
 * Same shape as `src/services/projects.ts`: endpoint strings, query keys, and
 * param-building only. No React, no fetching.
 */
import { buildListParams, type ListQuery } from './listParams';

export const AGENTS_ENDPOINT = '/api/v1/agents/';

export const agentDetailEndpoint = (id: string) => `${AGENTS_ENDPOINT}${id}/`;
export const agentDraftEndpoint = (id: string) => `${agentDetailEndpoint(id)}draft/`;
export const agentTestAskEndpoint = (id: string) => `${agentDraftEndpoint(id)}test/`;
export const agentPublishEndpoint = (id: string) => `${agentDetailEndpoint(id)}publish/`;
export const agentRollbackEndpoint = (id: string) => `${agentDetailEndpoint(id)}rollback/`;

export const AGENTS_LIST_KEY = 'agents-list';
export const AGENTS_PARAMETERS_KEY = 'agents-parameters';

export const agentDetailKey = (id: string) => ['agent-detail', id];
export const agentDraftKey = (id: string) => ['agent-draft', id];

export type AgentListQuery = ListQuery;
export const buildAgentListParams = buildListParams;

export function agentListUrl(query: AgentListQuery): string {
  const search = new URLSearchParams(
    Object.entries(buildAgentListParams(query)).map(([key, value]) => [key, String(value)])
  );
  return `${AGENTS_ENDPOINT}?${search.toString()}`;
}

export const AGENTS_PARAMETERS_URL = `${AGENTS_ENDPOINT}?type=parameters`;

/** Must be a subset of the searchable fields in `AgentSelector`. */
export const AGENT_SEARCH_COLUMNS = ['name'];
