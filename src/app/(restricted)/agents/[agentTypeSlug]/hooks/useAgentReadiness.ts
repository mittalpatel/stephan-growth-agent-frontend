'use client';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import {
  agentDomainsEndpoint,
  agentDomainsKey,
  agentKeysEndpoint,
  agentKeysKey,
} from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { AgentDeploymentKey, AllowedDomain } from '@/types/agent';

import { useAllKnowledgeSources } from '../knowledge/hooks/useAllKnowledgeSources';

/**
 * Read-only signal behind the "get your widget live" checklist on the agent
 * detail page: whether the org has usable knowledge, and whether at least one
 * allowed domain and one non-revoked deployment key exist. Deliberately its
 * own hook rather than reusing `useAgentDomains`/`useAgentDeploymentKeys` from
 * the Settings tab — those carry create/revoke mutations this checklist has no
 * business triggering, and this needs to run from the top-level view before
 * Settings is ever opened.
 *
 * Shares query keys with those Settings-tab hooks
 * (`agentDomainsKey`/`agentKeysKey`) and with the knowledge tab's own
 * `useAllKnowledgeSources`, so TanStack Query serves one cached fetch to both
 * once either has loaded — visiting Settings first costs nothing extra here,
 * and vice versa.
 *
 * `hasReadyKnowledge` is org-wide rather than resolved through this agent's
 * `AgentKnowledgeTarget` narrowing, which matches the backend's own fallback:
 * no target rows means the agent reads every shared source. A narrowed agent
 * pointed at only not-yet-ready sources would read as ready here, which is the
 * acceptable direction to be wrong for a checklist whose job is to stop
 * someone publishing with no knowledge at all.
 */
export function useAgentReadiness(agentId: string) {
  const { can } = usePermissions();
  const canView = can('agent', 'view');
  const canViewKnowledge = can('knowledge', 'view');
  const knowledge = useAllKnowledgeSources();

  const domainsQuery = useAuthQuery<ApiResponse<AllowedDomain[]>>(
    agentDomainsKey(agentId),
    agentDomainsEndpoint(agentId),
    { enabled: Boolean(agentId) && canView }
  );
  const keysQuery = useAuthQuery<ApiResponse<AgentDeploymentKey[]>>(
    agentKeysKey(agentId),
    agentKeysEndpoint(agentId),
    { enabled: Boolean(agentId) && canView }
  );

  return {
    /** Gates the knowledge step entirely: a reader who cannot see sources can
     * neither verify nor act on it, so showing them a permanently unticked box
     * would be noise. */
    canViewKnowledge,
    hasReadyKnowledge: knowledge.sources.some((source) => source.status === 'ready'),
    hasAllowedDomain: (domainsQuery.data?.data.length ?? 0) > 0,
    hasActiveKey: (keysQuery.data?.data ?? []).some((key) => !key.revoked_at),
    isLoading: (canView && (domainsQuery.isLoading || keysQuery.isLoading)) || knowledge.isLoading,
  };
}
