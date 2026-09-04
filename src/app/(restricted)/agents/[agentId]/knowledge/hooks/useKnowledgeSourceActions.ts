'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { getAxiosError } from '@/lib/helper';
import { t } from '@/locales';
import {
  knowledgeSourceDetailEndpoint,
  knowledgeSourceReprocessEndpoint,
  knowledgeSourcesListKey,
  websiteRecrawlEndpoint,
} from '@/services/knowledge';
import type { CrawlJob, KnowledgeSource, KnowledgeSourceUpdateInput } from '@/types/knowledge';
import type { ApiResponse } from '@/types/api';

/**
 * Per-source row actions on the knowledge sources list: rename, delete,
 * reprocess, recrawl (website sources only). Each invalidates the source
 * list on success rather than patching it locally — low-frequency actions
 * where a confirmed server read is worth the round trip, same rationale as
 * `useAgentActions`.
 */
export function useKnowledgeSourceActions(agentId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: knowledgeSourcesListKey(agentId) });
  };

  const renameMutation = useAuthMutation<ApiResponse<KnowledgeSource>, KnowledgeSourceUpdateInput>({
    onSuccess: () => {
      toast.success(t.knowledge.toast.renamed);
      invalidate();
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  const deleteMutation = useAuthMutation<ApiResponse<null>, undefined>({
    onSuccess: () => {
      toast.success(t.knowledge.toast.deleted);
      invalidate();
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  const reprocessMutation = useAuthMutation<ApiResponse<null>, undefined>({
    onSuccess: () => {
      toast.success(t.knowledge.toast.reprocessStarted);
      invalidate();
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  const recrawlMutation = useAuthMutation<ApiResponse<CrawlJob>, undefined>({
    onSuccess: (response) => {
      toast.success(
        response.message && response.message.length > 0
          ? response.message
          : t.knowledge.toast.recrawlStarted
      );
      invalidate();
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  return {
    rename: (sourceId: string, body: KnowledgeSourceUpdateInput) =>
      renameMutation.mutateAsync({
        url: knowledgeSourceDetailEndpoint(sourceId),
        body,
        method: 'patch',
      }),
    isRenaming: renameMutation.isPending,

    remove: (sourceId: string) =>
      deleteMutation.mutateAsync({
        url: knowledgeSourceDetailEndpoint(sourceId),
        method: 'delete',
      }),
    isDeleting: deleteMutation.isPending,

    reprocess: (sourceId: string) =>
      reprocessMutation.mutateAsync({ url: knowledgeSourceReprocessEndpoint(sourceId) }),
    isReprocessing: reprocessMutation.isPending,

    recrawl: (websiteSourceId: string) =>
      recrawlMutation.mutateAsync({ url: websiteRecrawlEndpoint(websiteSourceId) }),
    isRecrawling: recrawlMutation.isPending,
  };
}
