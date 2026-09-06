'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { getAxiosError } from '@/lib/helper';
import {
  agentDetailEndpoint,
  agentDetailKey,
  AGENTS_LIST_KEY,
  agentPublishEndpoint,
  agentRollbackEndpoint,
} from '@/services/agents';
import type { Agent, AgentRollbackInput, AgentUpdateInput } from '@/types/agent';
import type { ApiResponse } from '@/types/api';
import { t } from '@/locales';

/**
 * The mutations an agent's detail page needs beyond viewing it: edit, delete,
 * publish, rollback. Each invalidates the detail cache (and the list, where the
 * change is visible there too) rather than writing an optimistic update — these
 * are low-frequency, high-stakes actions where a confirmed server read is worth
 * the extra round trip.
 *
 * Two error-reporting shapes, picked per action by how its caller consumes it:
 *
 * - `publish`/`rollback` are fire-and-forget, so they toast from `onError` and
 *   expose `mutate`, which never rejects. `mutateAsync` with no awaiting caller
 *   leaves an unhandled rejection behind even though the error was reported.
 * - `update` is awaited by a form that binds field errors inline through
 *   `applyApiError`, so it carries no `onError` of its own — otherwise a failed
 *   save produces both a toast and an inline error for the same problem.
 *
 * `remove` is the one in between: awaited (the caller navigates away only on
 * success) but with no field to bind to, so it keeps its `onError` toast and
 * the call site swallows the rejection it has already reported.
 */
export function useAgentActions(agentId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: agentDetailKey(agentId) });
    void queryClient.invalidateQueries({ queryKey: [AGENTS_LIST_KEY] });
  };

  const updateMutation = useAuthMutation<ApiResponse<Agent>, AgentUpdateInput>({
    onSuccess: () => {
      toast.success(t.agents.toast.updated);
      invalidate();
    },
  });

  const deleteMutation = useAuthMutation<ApiResponse<null>, undefined>({
    onSuccess: () => {
      toast.success(t.agents.toast.deleted);
      void queryClient.invalidateQueries({ queryKey: [AGENTS_LIST_KEY] });
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  const publishMutation = useAuthMutation<ApiResponse<Agent>, undefined>({
    onSuccess: () => {
      toast.success(t.agents.toast.published);
      invalidate();
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  const rollbackMutation = useAuthMutation<ApiResponse<Agent>, AgentRollbackInput>({
    onSuccess: () => {
      toast.success(t.agents.toast.rolledBack);
      invalidate();
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  return {
    update: (body: AgentUpdateInput) =>
      updateMutation.mutateAsync({ url: agentDetailEndpoint(agentId), body, method: 'patch' }),
    isUpdating: updateMutation.isPending,

    remove: () =>
      deleteMutation.mutateAsync({ url: agentDetailEndpoint(agentId), method: 'delete' }),
    isDeleting: deleteMutation.isPending,

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
