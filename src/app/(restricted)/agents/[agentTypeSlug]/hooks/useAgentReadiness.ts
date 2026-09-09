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

/**
 * Read-only signal behind the "get your widget live" checklist on the agent
 * detail page: whether at least one allowed domain and one non-revoked
 * deployment key exist. Deliberately its own hook rather than reusing
 * `useAgentDomains`/`useAgentDeploymentKeys` from the Settings tab — those
 * carry create/revoke mutations this checklist has no business triggering,
 * and this needs to run from the top-level view before Settings is ever
 * opened.
 *
 * Shares query keys with those Settings-tab hooks
 * (`agentDomainsKey`/`agentKeysKey`), so TanStack Query serves one cached
 * fetch to both once either has loaded — visiting Settings first costs
 * nothing extra here, and vice versa.
 */
export function useAgentReadiness(agentId: string) {
  const { can } = usePermissions();
  const canView = can('agent', 'view');

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
    hasAllowedDomain: (domainsQuery.data?.data.length ?? 0) > 0,
    hasActiveKey: (keysQuery.data?.data ?? []).some((key) => !key.revoked_at),
    isLoading: canView && (domainsQuery.isLoading || keysQuery.isLoading),
  };
}
