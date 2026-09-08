'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { agentByTypeEndpoint, agentByTypeKey } from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { Agent } from '@/types/agent';

/**
 * One agent, resolved by its `AgentType` slug rather than its UUID.
 *
 * Agents are a fixed, auto-provisioned roster with no create flow, so the
 * frontend never learns a UUID from anything the user did — which is exactly
 * why the backend added `GET /agents/by-type/<slug>/`. A 404 here means this
 * organization has no agent of that kind, which is the normal state for every
 * type the backend hasn't shipped yet, so it renders as "not found" rather
 * than an error.
 */
export function useAgentDetail(agentTypeSlug: string) {
  const query = useAuthQuery<ApiResponse<Agent>>(
    agentByTypeKey(agentTypeSlug),
    agentByTypeEndpoint(agentTypeSlug),
    {
      enabled: Boolean(agentTypeSlug),
      retry: (failureCount, error) => error.response?.status !== 404 && failureCount < 2,
    }
  );

  return {
    agent: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isNotFound: query.error?.response?.status === 404,
    refetch: query.refetch,
  };
}
