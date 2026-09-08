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
 * One organization's live agent of a given kind, addressed by `AgentType`
 * slug instead of UUID (`AgentDetailByTypeView`, backend 2026-09-07). This is
 * what `/agents/[agentTypeSlug]` resolves through: agents are a fixed,
 * auto-provisioned roster, so a stable per-kind URL is addressable where a
 * UUID the user never sees is not. 404s for a type this organization has no
 * agent of, which is every type the backend hasn't shipped yet.
 */
export const agentByTypeEndpoint = (slug: string) => `${AGENTS_ENDPOINT}by-type/${slug}/`;
export const agentByTypeKey = (slug: string) => ['agent-by-type', slug];

/**
 * The platform-wide agent-type catalog (`GET`, `AgentTypeListView`) — not
 * agent-scoped, so it doesn't nest under `agentDetailEndpoint`.
 *
 * Returns only types the backend marks `is_available` (today just Website
 * Sales & Support). It takes no query parameters: `AgentTypeSelector.
 * get_available()` filters unconditionally, and there is no way to ask for
 * the unavailable ones. The `/agents` marketplace fills in the rest of the
 * four-agent roadmap from `AGENT_TYPE_ROADMAP` instead — see
 * `context/app/(restricted)/agents/page.md`.
 */
export const AGENT_TYPES_ENDPOINT = `${AGENTS_ENDPOINT}types/`;
export const AGENT_TYPES_KEY = ['agent-types'];
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

/**
 * `GET` on both endpoints landed 2026-09-07 (previously create/delete only,
 * which is why these query keys didn't exist before). Read-through cached on
 * the backend, keyed here by agent id like every other agent-nested query.
 */
export const agentDomainsKey = (id: string) => ['agent-domains', id];
export const agentKeysKey = (id: string) => ['agent-keys', id];

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
