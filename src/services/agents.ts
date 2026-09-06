/**
 * Agent endpoints and query keys.
 *
 * Same shape as `src/services/projects.ts`: endpoint strings, query keys, and
 * param-building only. No React, no fetching.
 */
import { buildListParams, type ListQuery } from './listParams';

export const AGENTS_ENDPOINT = '/api/v1/agents/';

export const agentDetailEndpoint = (id: string) => `${AGENTS_ENDPOINT}${id}/`;

/**
 * The platform-wide agent-type catalog (`GET`, `AgentTypeListView`) — not
 * agent-scoped, so it doesn't nest under `agentDetailEndpoint`. Default
 * (`includeUnavailable=false`) returns only creatable types (today just
 * Website Sales & Support); `includeUnavailable=true` returns every seeded
 * type, used by the `/agents/types` informational browse page — see
 * `context/app/(restricted)/agents/page.md`.
 */
export const agentTypesEndpoint = (includeUnavailable = false) =>
  includeUnavailable
    ? `${AGENTS_ENDPOINT}types/?include_unavailable=true`
    : `${AGENTS_ENDPOINT}types/`;
export const AGENT_TYPES_KEY = ['agent-types'];
export const ALL_AGENT_TYPES_KEY = ['agent-types', 'all'];
export const agentDraftEndpoint = (id: string) => `${agentDetailEndpoint(id)}draft/`;
export const agentTestAskEndpoint = (id: string) => `${agentDraftEndpoint(id)}test/`;
export const agentPublishEndpoint = (id: string) => `${agentDetailEndpoint(id)}publish/`;
export const agentRollbackEndpoint = (id: string) => `${agentDetailEndpoint(id)}rollback/`;

export const agentDomainsEndpoint = (id: string) => `${agentDetailEndpoint(id)}domains/`;
export const agentDomainDeleteEndpoint = (id: string, domainId: string) =>
  `${agentDomainsEndpoint(id)}${domainId}/`;
export const agentKeysEndpoint = (id: string) => `${agentDetailEndpoint(id)}keys/`;
export const agentKeyRevokeEndpoint = (id: string, keyId: string) =>
  `${agentKeysEndpoint(id)}${keyId}/revoke/`;

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
