'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { getAxiosError } from '@/lib/helper';
import { t } from '@/locales';
import {
  agentBuildIndexEndpoint,
  agentIndexVersionsEndpoint,
  indexVersionsListKey,
} from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type { IndexVersion } from '@/types/knowledge';

const DEFAULT_LIMIT = 10;

/**
 * An agent's index build history plus the "build index" action. Its own
 * small pagination (not URL-namespaced): this list lives inside a side
 * panel on the knowledge page, not as the page's primary list.
 */
export function useIndexVersions(agentId: string) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const listQuery = useAuthQuery<ApiResponse<IndexVersion[]>>(
    [...indexVersionsListKey(agentId), page],
    `${agentIndexVersionsEndpoint(agentId)}?page=${page}&page_size=${DEFAULT_LIMIT}`,
    { enabled: Boolean(agentId), placeholderData: (previous) => previous }
  );

  const buildMutation = useAuthMutation<ApiResponse<IndexVersion>, undefined>({
    onSuccess: () => {
      toast.success(t.knowledge.index.toast.buildStarted);
      void queryClient.invalidateQueries({ queryKey: indexVersionsListKey(agentId) });
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  const versions = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  return {
    versions,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    currentPage: meta?.current_page ?? page,
    totalPages: meta?.total_pages ?? 1,
    onPageChange: setPage,

    // Fire-and-forget (`mutate` never rejects); errors surface via `onError`.
    buildIndex: () => buildMutation.mutate({ url: agentBuildIndexEndpoint(agentId) }),
    isBuilding: buildMutation.isPending,
  };
}
