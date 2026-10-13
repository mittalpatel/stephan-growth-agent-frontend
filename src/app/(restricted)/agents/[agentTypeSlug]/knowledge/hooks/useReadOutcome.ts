'use client';

import { pageFailureReason } from '@/lib/pageFailure';

import { useDiscoveredUrls } from './useDiscoveredUrls';

/** Failed pages listed by name before the rest collapse into "N more". */
const MAX_LISTED_FAILURES = 5;

/**
 * What a finished read produced, from the source's own pages: how many were
 * added, failed or skipped, and which ones failed with why.
 *
 * Read from the pages rather than the crawl job so both add-website paths
 * report the same thing: "read the whole website" watches the source and
 * has no job to count from.
 */
export function useReadOutcome(websiteSourceId: string | null) {
  const { urls, isLoading } = useDiscoveredUrls(websiteSourceId);
  const selected = urls.filter((page) => page.is_selected);
  const failed = selected.filter((page) => page.status === 'failed');

  return {
    isLoading,
    indexed: selected.filter((page) => page.status === 'ready').length,
    failedCount: failed.length,
    skipped: selected.filter((page) => page.status === 'low_quality' || page.status === 'duplicate')
      .length,
    failures: failed
      .slice(0, MAX_LISTED_FAILURES)
      .map((page) => ({ id: page.id, url: page.url, reason: pageFailureReason(page) })),
    hiddenFailures: Math.max(0, failed.length - MAX_LISTED_FAILURES),
  };
}
