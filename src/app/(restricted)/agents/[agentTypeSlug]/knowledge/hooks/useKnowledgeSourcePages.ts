'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { getAxiosError } from '@/lib/helper';
import { t } from '@/locales';
import {
  discoveredUrlsKey,
  websiteDiscoveredUrlsEndpoint,
  websiteRecrawlPagesEndpoint,
} from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type { CrawlJob, DiscoveredUrl, RecrawlPagesInput } from '@/types/knowledge';

/**
 * The page-management panel for an already-extracted website source:
 * lists its pages (same data and endpoint the add-website wizard's review
 * step reads, `websiteDiscoveredUrlsEndpoint`) and lets the user recrawl a
 * chosen subset via the backend's 2026-09-09 `recrawl-pages/` endpoint,
 * rather than only being able to recrawl the whole site.
 */
export function useKnowledgeSourcePages(websiteSourceId: string | null) {
  const queryClient = useQueryClient();

  const listQuery = useAuthQuery<ApiResponse<DiscoveredUrl[]>>(
    discoveredUrlsKey(websiteSourceId ?? ''),
    `${websiteDiscoveredUrlsEndpoint(websiteSourceId ?? '')}?page_size=500`,
    { enabled: Boolean(websiteSourceId) }
  );

  const recrawlPagesMutation = useAuthMutation<ApiResponse<CrawlJob>, RecrawlPagesInput>({
    onSuccess: (response) => {
      toast.success(
        response.message && response.message.length > 0
          ? response.message
          : t.knowledge.toast.recrawlPagesStarted
      );
      void queryClient.invalidateQueries({ queryKey: discoveredUrlsKey(websiteSourceId ?? '') });
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  return {
    pages: listQuery.data?.data ?? [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,

    recrawlSelected: (pageIds: string[]) => {
      if (!websiteSourceId || pageIds.length === 0) return;
      recrawlPagesMutation.mutate({
        url: websiteRecrawlPagesEndpoint(websiteSourceId),
        body: { page_ids: pageIds },
      });
    },
    isRecrawling: recrawlPagesMutation.isPending,
  };
}
