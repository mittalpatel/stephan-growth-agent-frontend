'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { discoveredUrlsKey, websiteDiscoveredUrlsEndpoint } from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type { DiscoveredUrl } from '@/types/knowledge';

const POLL_INTERVAL_MS = 5000;

/**
 * Real "N of M pages processed" progress for a running extraction, derived
 * from the page list rather than the crawl job.
 *
 * `CrawlJob.included_count`/`failed_count` would be the obvious source, but
 * `extract_selected_pages` only writes them once, after its loop finishes —
 * they read 0 for the entire run, which is exactly the window a progress
 * indicator is for. Individual `Page.status` values *are* saved as each page
 * is processed, so counting the selected pages that have left `discovered`
 * gives an honest fraction with no backend change. If the job ever starts
 * reporting counters incrementally, delete this and read them instead.
 *
 * Shares `discoveredUrlsKey` with `useDiscoveredUrls`, so the wizard's review
 * step and this poll never duplicate a fetch. The list is a page-size-500 read
 * every few seconds, which is why `active` gates it down to just the
 * extracting step.
 */
export function useExtractionProgress(websiteSourceId: string | null, active: boolean) {
  const enabled = active && Boolean(websiteSourceId);

  const query = useAuthQuery<ApiResponse<DiscoveredUrl[]>>(
    discoveredUrlsKey(websiteSourceId ?? ''),
    `${websiteDiscoveredUrlsEndpoint(websiteSourceId ?? '')}?page_size=500`,
    { enabled, refetchInterval: enabled ? POLL_INTERVAL_MS : false }
  );

  const selected = (query.data?.data ?? []).filter((page) => page.is_selected);

  return {
    done: selected.filter((page) => page.status !== 'discovered').length,
    total: selected.length,
  };
}
