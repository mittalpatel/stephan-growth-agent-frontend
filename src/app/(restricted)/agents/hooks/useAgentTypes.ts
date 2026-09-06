'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { ALL_AGENT_TYPES_KEY, agentTypesEndpoint } from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { AgentType } from '@/types/agent';

/**
 * Every seeded agent type, available or not — for the informational
 * `/agents/types` browse page. `includeUnavailable=true` is always passed;
 * the default (creatable-only) shape has no consumer yet.
 */
export function useAgentTypes() {
  const query = useAuthQuery<ApiResponse<AgentType[]>>(
    ALL_AGENT_TYPES_KEY,
    agentTypesEndpoint(true)
  );

  return {
    agentTypes: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
