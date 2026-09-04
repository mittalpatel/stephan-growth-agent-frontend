'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { agentDetailEndpoint, agentDetailKey } from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { Agent } from '@/types/agent';

/** One agent, by id — see `useProjectDetail` for the pattern. */
export function useAgentDetail(agentId: string) {
  const query = useAuthQuery<ApiResponse<Agent>>(
    agentDetailKey(agentId),
    agentDetailEndpoint(agentId),
    {
      enabled: Boolean(agentId),
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
