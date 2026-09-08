'use client';

import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { getAxiosError } from '@/lib/helper';
import { t } from '@/locales';
import {
  agentKnowledgeTargetsEndpoint,
  knowledgeHealthKey,
  knowledgeTargetsKey,
} from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type { AgentKnowledgeTargetSetInput, AgentKnowledgeTargets } from '@/types/knowledge';

/**
 * One agent's `AgentKnowledgeTarget` narrowing set — the optional subset of
 * the org's shared knowledge sources this agent actually reads.
 *
 * The empty set is meaningful and is *not* "reads nothing": the backend's
 * `resolve_applicable_sources()` falls back to every org source when an
 * agent has no target rows, so no rows means "reads everything". `PUT`ing an
 * empty `source_ids` is therefore how an agent is explicitly un-narrowed,
 * which is why `save([])` is a real request rather than a short-circuit.
 *
 * Narrowing changes what a build indexes and what retrieval cross-checks, so
 * saving also invalidates the health summary — its source and chunk counts
 * are computed from exactly this set.
 */
export function useKnowledgeTargets(agentId: string) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canView = can('knowledge', 'view');
  const canManage = can('knowledge', 'manage');

  const query = useAuthQuery<ApiResponse<AgentKnowledgeTargets>>(
    knowledgeTargetsKey(agentId),
    agentKnowledgeTargetsEndpoint(agentId),
    { enabled: Boolean(agentId) && canView }
  );

  const mutation = useAuthMutation<
    ApiResponse<AgentKnowledgeTargets>,
    AgentKnowledgeTargetSetInput
  >({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: knowledgeTargetsKey(agentId) });
      void queryClient.invalidateQueries({ queryKey: knowledgeHealthKey(agentId) });
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  const data = query.data?.data;
  // Memoized: a fresh array each render would change the identity of every
  // callback below on every render, and the panel keys off it too.
  const selectedIds = useMemo(() => data?.targets.map((target) => target.source) ?? [], [data]);
  const isNarrowed = data?.is_narrowed ?? false;

  /**
   * `onSaved` fires only on success, which is what lets the panel drop its
   * local edits at exactly the right moment: keeping them through a failed
   * save is the difference between retrying and retyping.
   */
  const save = useCallback(
    (sourceIds: string[], onSaved?: () => void) => {
      mutation.mutate(
        {
          url: agentKnowledgeTargetsEndpoint(agentId),
          method: 'put',
          body: { source_ids: sourceIds },
        },
        {
          onSuccess: () => {
            toast.success(t.knowledge.targets.saved);
            onSaved?.();
          },
        }
      );
    },
    [agentId, mutation]
  );

  /**
   * Add one source to the narrowing set, if this agent is narrowed at all.
   *
   * Called right after a source is created from this agent's page. Without
   * it, a narrowed agent would create a source it cannot then see — and,
   * worse, the crawl-job progress read (`AgentCrawlJobDetailView` filters by
   * `resolve_applicable_sources`) would 404 mid-flow. An un-narrowed agent
   * already reads everything, so for it this is correctly a no-op: adding a
   * row would silently narrow the agent to exactly one source.
   */
  const includeSource = useCallback(
    (sourceId: string) => {
      if (!canManage || !isNarrowed || selectedIds.includes(sourceId)) return;
      mutation.mutate({
        url: agentKnowledgeTargetsEndpoint(agentId),
        method: 'put',
        body: { source_ids: [...selectedIds, sourceId] },
      });
    },
    [agentId, canManage, isNarrowed, mutation, selectedIds]
  );

  return {
    selectedIds,
    isNarrowed,
    canManage,
    isLoading: canView && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    save,
    includeSource,
    isSaving: mutation.isPending,
  };
}
