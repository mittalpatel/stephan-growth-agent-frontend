'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { getAxiosError, getErrorCode } from '@/lib/helper';
import {
  agentByTypeKey,
  agentDetailEndpoint,
  agentDetailKey,
  agentDraftKey,
  AGENTS_LIST_KEY,
  agentPublishEndpoint,
  agentRollbackEndpoint,
} from '@/services/agents';
import type { Agent, AgentRollbackInput, AgentUpdateInput } from '@/types/agent';
import type { ApiResponse } from '@/types/api';
import { t } from '@/locales';

/**
 * The mutations an agent's detail page needs beyond viewing it: edit,
 * publish, rollback. Each writes the server's confirmed response into the
 * detail caches (see `applyAgent`) rather than an optimistic update — these
 * are low-frequency, high-stakes actions, so the cache only ever holds what
 * the server actually returned.
 *
 * No `remove`: the backend removed `DELETE /agents/{id}/` entirely
 * (2026-09-07) — an organization's agents are a fixed, auto-provisioned
 * roster, never deleted by a tenant.
 *
 * Two error-reporting shapes, picked per action by how its caller consumes it:
 *
 * - `publish`/`rollback` are fire-and-forget, so they toast from `onError` and
 *   expose `mutate`, which never rejects. `mutateAsync` with no awaiting caller
 *   leaves an unhandled rejection behind even though the error was reported.
 * - `update` is awaited by a form that binds field errors inline through
 *   `applyApiError`, so it carries no `onError` of its own — otherwise a failed
 *   save produces both a toast and an inline error for the same problem.
 */
export function useAgentActions(agentId: string) {
  const queryClient = useQueryClient();

  /* The agent page reads `agentByTypeKey(slug)`, not `agentDetailKey(id)`, so
     invalidating only the id key left the Publish tab showing the previous live
     version. Every one of these endpoints answers with the full updated agent
     (`AgentSerializer`), so it is written into both keys instead of refetched:
     a refetch of the by-type endpoint could also land on a server-side cache
     entry the write has not cleared yet. The draft is invalidated because a
     publish consumes it. */
  const applyAgent = (response: ApiResponse<Agent>) => {
    queryClient.setQueryData(agentDetailKey(agentId), response);
    queryClient.setQueryData(agentByTypeKey(response.data.agent_type.slug), response);
    void queryClient.invalidateQueries({ queryKey: agentDraftKey(agentId) });
    void queryClient.invalidateQueries({ queryKey: [AGENTS_LIST_KEY] });
  };

  const updateMutation = useAuthMutation<ApiResponse<Agent>, AgentUpdateInput>({
    onSuccess: (response) => {
      toast.success(t.agents.toast.updated);
      applyAgent(response);
    },
  });

  const publishMutation = useAuthMutation<ApiResponse<Agent>, undefined>({
    onSuccess: (response) => {
      toast.success(t.agents.toast.published);
      applyAgent(response);
    },
    // `no_draft` and `disclosure_cannot_be_disabled` get dedicated copy since
    // they're reachable, expected states, not surprise failures. Everything
    // else (including `missing_language_localization`, whose backend message
    // already names the specific missing languages/fields) falls back to the
    // server's own message text via getAxiosError.
    onError: (error) => {
      const code = getErrorCode(error);
      if (code === 'no_draft') {
        toast.error(t.agents.toast.publishNoDraft);
      } else if (code === 'disclosure_cannot_be_disabled') {
        toast.error(t.agents.toast.publishDisclosureRequired);
      } else {
        toast.error(getAxiosError(error));
      }
    },
  });

  const rollbackMutation = useAuthMutation<ApiResponse<Agent>, AgentRollbackInput>({
    onSuccess: (response) => {
      toast.success(t.agents.toast.rolledBack);
      applyAgent(response);
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  return {
    update: (body: AgentUpdateInput) =>
      updateMutation.mutateAsync({ url: agentDetailEndpoint(agentId), body, method: 'patch' }),
    isUpdating: updateMutation.isPending,

    publish: () => publishMutation.mutate({ url: agentPublishEndpoint(agentId) }),
    isPublishing: publishMutation.isPending,

    rollback: (targetVersionId: string) =>
      rollbackMutation.mutate({
        url: agentRollbackEndpoint(agentId),
        body: { target_version_id: targetVersionId },
      }),
    isRollingBack: rollbackMutation.isPending,
  };
}
