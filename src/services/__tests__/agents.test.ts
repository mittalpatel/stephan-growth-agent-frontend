import { describe, it, expect } from 'vitest';

import {
  agentDetailEndpoint,
  agentDetailKey,
  agentDomainDeleteEndpoint,
  agentDomainsEndpoint,
  agentDomainsKey,
  agentDraftEndpoint,
  agentDraftKey,
  agentKeyRevokeEndpoint,
  agentKeysEndpoint,
  agentKeysKey,
  agentListUrl,
  agentPublishEndpoint,
  agentRollbackEndpoint,
  agentTestAskEndpoint,
  AGENT_TYPES_ENDPOINT,
  AGENTS_ENDPOINT,
  agentByTypeEndpoint,
  agentByTypeKey,
} from '../agents';

const AGENT_ID = '0c2f6a1e-1111-4a2b-8c3d-4e5f60718293';

describe('agent endpoints', () => {
  it('nests the agent id in every detail-scoped endpoint', () => {
    expect(agentDetailEndpoint(AGENT_ID)).toBe(`${AGENTS_ENDPOINT}${AGENT_ID}/`);
    expect(agentDraftEndpoint(AGENT_ID)).toBe(`${AGENTS_ENDPOINT}${AGENT_ID}/draft/`);
    expect(agentTestAskEndpoint(AGENT_ID)).toBe(`${AGENTS_ENDPOINT}${AGENT_ID}/draft/test/`);
    expect(agentPublishEndpoint(AGENT_ID)).toBe(`${AGENTS_ENDPOINT}${AGENT_ID}/publish/`);
    expect(agentRollbackEndpoint(AGENT_ID)).toBe(`${AGENTS_ENDPOINT}${AGENT_ID}/rollback/`);
  });

  it('points the agent-type catalog at the bare list endpoint', () => {
    // No query string: `AgentTypeListView` takes no parameters, so anything
    // appended here would be silently ignored by the backend.
    expect(AGENT_TYPES_ENDPOINT).toBe(`${AGENTS_ENDPOINT}types/`);
  });

  it('addresses an agent by its type slug, not its id', () => {
    // The detail route resolves through this: agents are auto-provisioned, so
    // the frontend never learns a UUID from anything the user did.
    expect(agentByTypeEndpoint('sevo')).toBe(`${AGENTS_ENDPOINT}by-type/sevo/`);
    expect(agentByTypeKey('sevo')).toEqual(['agent-by-type', 'sevo']);
  });

  it('builds distinct query keys per agent', () => {
    expect(agentDetailKey(AGENT_ID)).toEqual(['agent-detail', AGENT_ID]);
    expect(agentDraftKey(AGENT_ID)).toEqual(['agent-draft', AGENT_ID]);
    expect(agentDomainsKey(AGENT_ID)).toEqual(['agent-domains', AGENT_ID]);
    expect(agentKeysKey(AGENT_ID)).toEqual(['agent-keys', AGENT_ID]);
  });

  it('nests the domain and deployment key endpoints under the agent id', () => {
    const DOMAIN_ID = '1a2b3c4d-1111-4a2b-8c3d-4e5f60718293';
    const KEY_ID = '9f8e7d6c-1111-4a2b-8c3d-4e5f60718293';

    expect(agentDomainsEndpoint(AGENT_ID)).toBe(`${AGENTS_ENDPOINT}${AGENT_ID}/domains/`);
    expect(agentDomainDeleteEndpoint(AGENT_ID, DOMAIN_ID)).toBe(
      `${AGENTS_ENDPOINT}${AGENT_ID}/domains/${DOMAIN_ID}/`
    );
    expect(agentKeysEndpoint(AGENT_ID)).toBe(`${AGENTS_ENDPOINT}${AGENT_ID}/keys/`);
    expect(agentKeyRevokeEndpoint(AGENT_ID, KEY_ID)).toBe(
      `${AGENTS_ENDPOINT}${AGENT_ID}/keys/${KEY_ID}/revoke/`
    );
  });

  it('encodes list params onto the list endpoint', () => {
    const url = agentListUrl({
      page: 2,
      limit: 25,
      search: [],
      search_by: '',
      sort: 'name',
      sort_direction: 'asc',
      filter: [],
      filter_by: [],
    });
    expect(url).toContain(AGENTS_ENDPOINT);
    expect(url).toContain('page=2');
    expect(url).toContain('page_size=25');
    expect(url).toContain('sort=name');
    expect(url).toContain('sort_direction=asc');
  });
});
