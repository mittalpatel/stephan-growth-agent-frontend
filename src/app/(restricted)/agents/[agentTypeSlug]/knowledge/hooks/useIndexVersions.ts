'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { getAxiosError } from '@/lib/helper';
import { format, formatNumber } from '@/lib/i18n';
import { t } from '@/locales';
import {
  agentBuildIndexEndpoint,
  agentIndexVersionsEndpoint,
  indexVersionsListKey,
  knowledgeHealthKey,
} from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type { IndexVersion, IndexVersionStatus } from '@/types/knowledge';

const DEFAULT_LIMIT = 10;
const POLL_INTERVAL_MS = 5000;

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
    {
      enabled: Boolean(agentId),
      placeholderData: (previous) => previous,
      // The newest version (list is ordered `-version_number`) goes through
      // `building` while `build_index_version` runs in the background —
      // triggered either by this panel's own "Build index" action or
      // automatically after an extraction elsewhere on the page. Poll only
      // while that's true, so the status flips to `ready`/`failed` on its
      // own instead of needing a manual refetch.
      refetchInterval: (query) => {
        const versions = query.state.data?.data ?? [];
        return versions[0]?.status === 'building' ? POLL_INTERVAL_MS : false;
      },
    }
  );

  // Once the newest version leaves `building`, the health summary
  // (indexed_chunks/score) it feeds is stale too — refresh it right when the
  // build actually finishes, rather than waiting for the next unrelated
  // invalidation.
  const latest = listQuery.data?.data[0];
  const latestStatus = latest?.status;
  const previousStatusRef = useRef<IndexVersionStatus | undefined>(latestStatus);
  useEffect(() => {
    if (previousStatusRef.current === 'building' && latestStatus !== 'building') {
      void queryClient.invalidateQueries({ queryKey: knowledgeHealthKey(agentId) });
      // The build ends minutes after the click, usually with the panel out
      // of view; without this nothing said it had finished (client testing,
      // 13 Oct 2026).
      if (latestStatus === 'ready' && latest) {
        toast.success(
          format(t.knowledge.index.toast.buildReady, {
            number: latest.version_number,
            chunks: formatNumber(latest.chunk_count),
          })
        );
      } else if (latestStatus === 'failed') {
        toast.error(t.knowledge.index.toast.buildFailed);
      }
    }
    previousStatusRef.current = latestStatus;
  }, [latestStatus, latest, agentId, queryClient]);

  const buildMutation = useAuthMutation<ApiResponse<IndexVersion>, undefined>({
    onSuccess: (response) => {
      // With nothing changed since the last build the backend returns that
      // ready version instead of adding an identical row (retest, 14 Oct).
      toast.success(
        response.data?.status === 'ready'
          ? t.knowledge.index.toast.upToDate
          : t.knowledge.index.toast.buildStarted
      );
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
    /** True for the whole build, not only the request: the button used to
     * re-enable while the new version was still `building`. */
    isBuilding: buildMutation.isPending || (page === 1 && latestStatus === 'building'),
    /** The version being built, for "Building v4…". `null` otherwise. */
    buildingVersion: latestStatus === 'building' ? (latest?.version_number ?? null) : null,
  };
}
