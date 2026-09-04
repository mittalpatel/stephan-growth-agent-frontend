'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { discoveredUrlsKey, websiteDiscoveredUrlsEndpoint } from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type { DiscoveredUrl, DiscoveredUrlBulkActionInput } from '@/types/knowledge';

/**
 * The discovered-URLs review step of the add-website flow: list every page
 * the discovery crawl found, and let the user select which ones to extract.
 * Each toggle is its own bulk-PATCH call (with a single id) rather than
 * batched client-side — the review list is small enough that round-trip
 * cost isn't a concern, and this keeps the selection state server-driven.
 */
export function useDiscoveredUrls(websiteSourceId: string | null) {
  const queryClient = useQueryClient();

  const listQuery = useAuthQuery<ApiResponse<DiscoveredUrl[]>>(
    discoveredUrlsKey(websiteSourceId ?? ''),
    `${websiteDiscoveredUrlsEndpoint(websiteSourceId ?? '')}?page_size=500`,
    { enabled: Boolean(websiteSourceId) }
  );

  const { mutateAsync } = useAuthMutation<ApiResponse<unknown>, DiscoveredUrlBulkActionInput>();

  const applyBulkAction = async (body: DiscoveredUrlBulkActionInput) => {
    if (!websiteSourceId) return false;
    try {
      await mutateAsync({
        url: websiteDiscoveredUrlsEndpoint(websiteSourceId),
        body,
        method: 'patch',
      });
      await listQuery.refetch();
      return true;
    } catch (error) {
      applyApiError(error);
      return false;
    }
  };

  const urls = listQuery.data?.data ?? [];

  return {
    urls,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    selectedCount: urls.filter((url) => url.is_selected).length,

    toggle: (urlId: string, selected: boolean) =>
      applyBulkAction(selected ? { select_ids: [urlId] } : { deselect_ids: [urlId] }),
    selectAll: () => applyBulkAction({ select_ids: urls.map((url) => url.id) }),
    deselectAll: () => applyBulkAction({ deselect_ids: urls.map((url) => url.id) }),
    invalidate: () =>
      queryClient.invalidateQueries({ queryKey: discoveredUrlsKey(websiteSourceId ?? '') }),
  };
}
