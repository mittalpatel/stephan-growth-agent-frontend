'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { agentDraftEndpoint, agentDraftKey } from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { AgentVersionDetail } from '@/types/agent';

/**
 * The agent's current draft version, via `GET /agents/{id}/draft/`
 * (backend 2026-09-07, closing a gap where this view was PATCH-only).
 *
 * `publish()` clears `Agent.draft_version` (`AgentService.publish()`), so
 * this 404s with `agent_no_draft` right after every publish — an expected,
 * settled state, not a stuck load. `isNotFound` lets a caller tell that
 * apart from `isLoading` instead of showing a loading skeleton forever.
 *
 * `createDraft` covers that state: `PATCH /agents/{id}/draft/` with an empty
 * body still calls `AgentService.update_draft`, which clones the published
 * version into a fresh draft when none exists yet (see `agent_service.py`'s
 * class docstring, point 1) without changing any field, then this refetches
 * so the real cloned values populate the form — never rendering it pre-filled
 * with the draft form's own blank defaults, which would overwrite the
 * published content with blanks on the first save.
 */
export function useAgentDraft(agentId: string) {
  const queryClient = useQueryClient();
  const query = useAuthQuery<ApiResponse<AgentVersionDetail>>(
    agentDraftKey(agentId),
    agentDraftEndpoint(agentId),
    { enabled: Boolean(agentId) }
  );

  const createDraftMutation = useAuthMutation<
    ApiResponse<AgentVersionDetail>,
    Record<string, never>
  >({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentDraftKey(agentId) });
    },
  });

  return {
    draft: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isNotFound: query.isError && !query.isLoading,
    refetch: query.refetch,
    createDraft: () =>
      createDraftMutation.mutateAsync({
        url: agentDraftEndpoint(agentId),
        body: {},
        method: 'patch',
      }),
    isCreatingDraft: createDraftMutation.isPending,
  };
}
