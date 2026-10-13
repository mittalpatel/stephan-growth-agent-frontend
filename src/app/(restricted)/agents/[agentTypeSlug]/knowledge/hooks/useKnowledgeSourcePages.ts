'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { getAxiosError } from '@/lib/helper';
import { t } from '@/locales';
import {
  discoveredUrlsKey,
  INDEX_VERSIONS_LIST_KEY,
  KNOWLEDGE_HEALTH_KEY,
  KNOWLEDGE_SOURCES_LIST_KEY,
  websiteRecrawlPagesEndpoint,
} from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type { CrawlJob, RecrawlPagesInput } from '@/types/knowledge';

import { useDiscoveredUrls } from './useDiscoveredUrls';

/**
 * The dedicated page-management route for an already-extracted website source.
 *
 * Composes `useDiscoveredUrls` rather than re-reading the same endpoint itself:
 * both surfaces are views over one source's `Page` rows, share
 * `discoveredUrlsKey`, and need the same optimistic include/exclude behaviour.
 * The two were separate hooks over identical data until 2026-09-11, which is
 * how this route shipped without the include/exclude and remove actions the
 * wizard's review step already had.
 *
 * What this hook adds on top is the one thing the wizard has no use for:
 * selective recrawl of specific already-known pages, via the backend's
 * `recrawl-pages/` endpoint.
 */
export function useKnowledgeSourcePages(
  websiteSourceId: string | null,
  options: Readonly<{ isReading?: boolean }> = {}
) {
  const queryClient = useQueryClient();
  const pages = useDiscoveredUrls(websiteSourceId, { pollWhile: options.isReading });

  // Polling stops the moment the read ends, which can be just before the
  // last pages are saved: one final fetch shows them as read instead of
  // leaving them on "Not read yet" until the next visit.
  const wasReading = useRef(false);
  useEffect(() => {
    if (wasReading.current && !options.isReading && websiteSourceId) {
      void queryClient.invalidateQueries({ queryKey: discoveredUrlsKey(websiteSourceId) });
    }
    wasReading.current = Boolean(options.isReading);
  }, [options.isReading, websiteSourceId, queryClient]);

  const recrawlPagesMutation = useAuthMutation<ApiResponse<CrawlJob>, RecrawlPagesInput>({
    onSuccess: (response) => {
      toast.success(
        response.message && response.message.length > 0
          ? response.message
          : t.knowledge.toast.recrawlPagesStarted
      );
      void queryClient.invalidateQueries({ queryKey: discoveredUrlsKey(websiteSourceId ?? '') });
      // A recrawl re-extracts the selected pages, which also kicks off a
      // background index rebuild for every agent this source feeds. No agent id
      // is known here (this route is source-scoped, not agent-scoped), so
      // invalidate by key prefix rather than a specific agent's entry.
      // The source flips to "processing" server-side; wake the org-wide list so
      // the progress shown on this page and in the app bar starts straight
      // away instead of at the next poll.
      void queryClient.invalidateQueries({ queryKey: [KNOWLEDGE_SOURCES_LIST_KEY] });
      void queryClient.invalidateQueries({ queryKey: [INDEX_VERSIONS_LIST_KEY] });
      void queryClient.invalidateQueries({ queryKey: [KNOWLEDGE_HEALTH_KEY] });
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  return {
    pages: pages.urls,
    isLoading: pages.isLoading,
    isError: pages.isError,
    refetch: pages.refetch,
    isTruncated: pages.isTruncated,
    total: pages.total,

    /** Whether a page's content feeds the index. Indexing needs `is_selected`
     * *and* `status === 'ready'`, so excluding a page here removes it from
     * retrieval on the next build without discarding what was already
     * crawled. */
    setIncluded: (pageId: string, included: boolean) =>
      included ? pages.selectMany([pageId]) : pages.deselectMany([pageId]),
    /** Drops the page entirely, distinct from excluding it: the row goes away
     * and a later recrawl has to rediscover the URL. */
    removePage: pages.removeUrl,
    /** A page outside what discovery found, added manually after extraction. */
    addUrl: pages.addUrl,

    /** `onStarted` runs once the read is accepted, so the caller can clear
     * its selection: left ticked, the next click re-reads the same pages. */
    recrawlSelected: (pageIds: string[], onStarted?: () => void) => {
      if (!websiteSourceId || pageIds.length === 0) return;
      recrawlPagesMutation.mutate(
        { url: websiteRecrawlPagesEndpoint(websiteSourceId), body: { page_ids: pageIds } },
        { onSuccess: () => onStarted?.() }
      );
    },
    isRecrawling: recrawlPagesMutation.isPending,
  };
}
