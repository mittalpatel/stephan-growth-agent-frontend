'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { agentDraftEndpoint, agentDraftKey } from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { AgentVersionDetail } from '@/types/agent';

/**
 * The agent's current draft version, via `GET /agents/{id}/draft/`
 * (backend 2026-09-07, closing a gap where this view was PATCH-only).
 */
export function useAgentDraft(agentId: string) {
  const query = useAuthQuery<ApiResponse<AgentVersionDetail>>(
    agentDraftKey(agentId),
    agentDraftEndpoint(agentId),
    { enabled: Boolean(agentId) }
  );

  return {
    draft: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
