'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { agentVersionsEndpoint, agentVersionsKey } from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { AgentVersionListItem } from '@/types/agent';

/**
 * `GET /agents/{id}/versions/` (backend 2026-09-16) — an agent's version
 * history, most recent first, for the rollback picker. Fetched lazily
 * (`enabled`) rather than alongside the agent detail: the list is unbounded
 * and never cached server-side, so there's no reason to pay for it before the
 * picker is actually opened.
 */
export function useAgentVersions(agentId: string, enabled: boolean) {
  const query = useAuthQuery<ApiResponse<AgentVersionListItem[]>>(
    agentVersionsKey(agentId),
    agentVersionsEndpoint(agentId),
    { enabled }
  );

  return {
    versions: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
