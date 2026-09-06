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
 *
 * Takes no agent id: every one of these routes is source-scoped, and the
 * list they invalidate is the organization's single shared one.
 */
export function useKnowledgeSourceActions() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: knowledgeSourcesListKey() });
  };

  // No `onError`: `RenameSourceDialog` awaits this and binds field errors
  // inline via `applyApiError`, so a toast here would double-report.
  const renameMutation = useAuthMutation<ApiResponse<KnowledgeSource>, KnowledgeSourceUpdateInput>({
    onSuccess: () => {
      toast.success(t.knowledge.toast.renamed);
      invalidate();
    },
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

    // Fire-and-forget (`mutate` never rejects); errors surface via `onError`.
    reprocess: (sourceId: string) =>
      reprocessMutation.mutate({ url: knowledgeSourceReprocessEndpoint(sourceId) }),
    isReprocessing: reprocessMutation.isPending,

    recrawl: (websiteSourceId: string) =>
      recrawlMutation.mutate({ url: websiteRecrawlEndpoint(websiteSourceId) }),
    isRecrawling: recrawlMutation.isPending,
  };
}
