'use client';

import { useQueryClient } from '@tanstack/react-query';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { discoveredUrlsKey, websiteDiscoveredUrlsEndpoint } from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type { DiscoveredUrl, DiscoveredUrlBulkActionInput } from '@/types/knowledge';

/**
 * The discovered-URLs review step of the add-website flow: list every page the
 * discovery crawl found, and let the user choose which ones to extract.
 *
 * Selection is applied optimistically. Selection state is server-owned (each
 * toggle is its own bulk-PATCH), and the first version awaited the PATCH and
 * then refetched the whole list before the checkbox moved — on a real crawl
 * that is a round trip plus a 250-row refetch per click, so boxes appeared not
 * to respond and users clicked them again. The cache is patched first and the
 * refetch dropped; `withOptimisticPatch` rolls the row back and toasts if the
 * PATCH fails, so the list can never silently disagree with the server.
 *
 * `add`/`remove_ids` still refetch: both change which rows exist, and the
 * server assigns the id of anything added, so there is nothing to patch in.
 */
export function useDiscoveredUrls(websiteSourceId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = discoveredUrlsKey(websiteSourceId ?? '');

  const listQuery = useAuthQuery<ApiResponse<DiscoveredUrl[]>>(
    queryKey,
    `${websiteDiscoveredUrlsEndpoint(websiteSourceId ?? '')}?page_size=500`,
    { enabled: Boolean(websiteSourceId) }
  );

  const { mutateAsync } = useAuthMutation<ApiResponse<unknown>, DiscoveredUrlBulkActionInput>();

  const sendBulkAction = (body: DiscoveredUrlBulkActionInput) =>
    mutateAsync({
      url: websiteDiscoveredUrlsEndpoint(websiteSourceId ?? ''),
      body,
      method: 'patch',
    });

  /** Adds/removes rows, so the list has to be re-read afterwards. */
  const applyStructuralAction = async (body: DiscoveredUrlBulkActionInput) => {
    if (!websiteSourceId) return false;
    try {
      await sendBulkAction(body);
      await listQuery.refetch();
      return true;
    } catch (error) {
      applyApiError(error);
      return false;
    }
  };

  /** Flips `is_selected` on the given ids in the cache, returning a rollback. */
  const patchSelection = (ids: readonly string[], selected: boolean) => {
    const previous = queryClient.getQueryData<ApiResponse<DiscoveredUrl[]>>(queryKey);
    const target = new Set(ids);
    queryClient.setQueryData<ApiResponse<DiscoveredUrl[]>>(queryKey, (current) =>
      current
        ? {
            ...current,
            data: current.data.map((url) =>
              target.has(url.id) ? { ...url, is_selected: selected } : url
            ),
          }
        : current
    );
    return () => queryClient.setQueryData(queryKey, previous);
  };

  const setSelection = async (ids: readonly string[], selected: boolean) => {
    if (!websiteSourceId || ids.length === 0) return;
    const rollback = patchSelection(ids, selected);
    try {
      await sendBulkAction(selected ? { select_ids: [...ids] } : { deselect_ids: [...ids] });
    } catch (error) {
      rollback();
      applyApiError(error);
    }
  };

  const urls = listQuery.data?.data ?? [];

  return {
    urls,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    selectedCount: urls.filter((url) => url.is_selected).length,

    toggle: (urlId: string, selected: boolean) => setSelection([urlId], selected),
    /** Both take explicit ids so the caller can scope them to a filtered view
     * rather than always meaning the entire crawl. */
    selectMany: (ids: readonly string[]) => setSelection(ids, true),
    deselectMany: (ids: readonly string[]) => setSelection(ids, false),
    /** A URL outside what discovery found, added manually before extraction. */
    addUrl: (url: string) => applyStructuralAction({ add: [url] }),
    /** Removes a page outright, distinct from deselecting: a deselected row
     * stays in the list (excluded from extraction, still visible); this
     * drops it entirely. */
    removeUrl: (urlId: string) => applyStructuralAction({ remove_ids: [urlId] }),
    invalidate: () => queryClient.invalidateQueries({ queryKey }),
  };
}
