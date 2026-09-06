'use client';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import {
  KNOWLEDGE_SOURCES_ENDPOINT,
  KNOWLEDGE_SOURCES_LIST_KEY,
  KNOWLEDGE_TARGET_PICKER_PAGE_SIZE,
} from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type { KnowledgeSourceListItem } from '@/types/knowledge';

/**
 * Every shared source in the organization, unfiltered and unsorted by the
 * list toolbar.
 *
 * Deliberately a separate read from `useKnowledgeSources` rather than a reuse
 * of it: the target picker must show the full set to be correct, and the
 * toolbar's page/search/filter state would otherwise decide which sources an
 * operator is even able to narrow to. Its own query key for the same reason —
 * sharing one with the paginated list would have the two overwrite each
 * other's cache entry on every filter change.
 */
export function useAllKnowledgeSources() {
  const { can } = usePermissions();
  const canView = can('knowledge', 'view');

  const query = useAuthQuery<ApiResponse<KnowledgeSourceListItem[]>>(
    [KNOWLEDGE_SOURCES_LIST_KEY, 'all'],
    `${KNOWLEDGE_SOURCES_ENDPOINT}?page=1&page_size=${KNOWLEDGE_TARGET_PICKER_PAGE_SIZE}`,
    { enabled: canView }
  );

  const sources = query.data?.data ?? [];
  const total = query.data?.meta?.count ?? sources.length;

  return {
    sources,
    /** True when the org has more sources than one max-size page can carry. */
    isTruncated: total > sources.length,
    total,
    isLoading: canView && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
