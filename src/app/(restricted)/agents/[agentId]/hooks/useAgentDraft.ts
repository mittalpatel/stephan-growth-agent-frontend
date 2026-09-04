'use client';

import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import axiosAuth from '@/client/axiosAuth';
import { agentDraftEndpoint, agentDraftKey } from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { AgentVersionDetail } from '@/types/agent';

/**
 * The agent's current draft version.
 *
 * `PATCH /agents/{id}/draft/` is the only endpoint the backend exposes for the
 * draft — there is no dedicated `GET`. `AgentService.update_draft()` is a no-op
 * write when called with no fields (it still creates the draft on first call,
 * cloned from the published version, or blank — see its docstring), so an
 * empty-body `PATCH` doubles as a read: it returns the current
 * `AgentVersionDetailSerializer` shape without changing anything already there.
 */
export function useAgentDraft(agentId: string) {
  const query = useQuery<ApiResponse<AgentVersionDetail>, AxiosError>({
    queryKey: agentDraftKey(agentId),
    queryFn: async () => {
      const { data } = await axiosAuth.patch<ApiResponse<AgentVersionDetail>>(
        agentDraftEndpoint(agentId),
        {}
      );
      return data;
    },
    enabled: Boolean(agentId),
  });

  return {
    draft: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
