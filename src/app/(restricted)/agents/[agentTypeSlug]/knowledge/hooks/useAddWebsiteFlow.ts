'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import type { WebsiteDiscoverSubmitValues } from '@/lib/schemas/knowledge';
import {
  discoveredUrlsKey,
  indexVersionsListKey,
  knowledgeHealthKey,
  KNOWLEDGE_WEBSITE_DISCOVER_ENDPOINT,
  knowledgeSourcesListKey,
  websiteExtractEndpoint,
} from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type { CrawlJob, WebsiteDiscoverInput, WebsiteDiscoverResult } from '@/types/knowledge';

/** `RHFStringListField`'s row shape back to the plain `string[]` the API wants. */
function fromRows(rows: { value: string }[] | undefined): string[] {
  return (rows ?? []).map((row) => row.value.trim()).filter(Boolean);
}

/**
 * Assembles the form's flat scope fields into `scope_config`, omitting any
 * key the operator left untouched so a default submission still posts
 * `{ root_url }` alone with no behavior change from before this field
 * existed. Returns `undefined` (not `{}`) when nothing was set, so the
 * caller can spread it away entirely rather than posting an empty object.
 */
function buildScopeConfig(
  values: WebsiteDiscoverSubmitValues
): Record<string, unknown> | undefined {
  const scope: Record<string, unknown> = {};
  if (values.max_pages !== '' && values.max_pages !== undefined) scope.max_pages = values.max_pages;
  if (values.max_depth !== '' && values.max_depth !== undefined) scope.max_depth = values.max_depth;
  const includePaths = fromRows(values.include_paths);
  const excludePaths = fromRows(values.exclude_paths);
  if (includePaths.length) scope.include_paths = includePaths;
  if (excludePaths.length) scope.exclude_paths = excludePaths;
  return Object.keys(scope).length > 0 ? scope : undefined;
}

export type AddWebsiteStep =
  | 'form'
  | 'discovering'
  | 'review'
  | 'extracting'
  | 'done'
  | 'discovery-failed'
  | 'extraction-failed';

/**
 * Orchestrates the multi-step add-website dialog: discover → poll → review
 * → extract → poll → done. Holds only the ids the next step needs
 * (`discoverJobId`/`websiteSourceId`/`extractJobId`) — the actual polling
 * happens in `useCrawlJob`, called from the dialog component with whichever
 * job id is currently active, so this hook stays a plain state machine.
 *
 * Discovery is org-level (the source is shared), but crawl-job progress is
 * still read through an agent-scoped route, so `agentId` is kept for the
 * polling step. `onCreated` fires as soon as the source exists rather than
 * at the end of the flow: a narrowed agent has to be able to see the source
 * before its own crawl-job read will resolve it at all.
 */
export function useAddWebsiteFlow(agentId: string, onCreated?: (sourceId: string) => void) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<AddWebsiteStep>('form');
  const [websiteSourceId, setWebsiteSourceId] = useState<string | null>(null);
  const [discoverJobId, setDiscoverJobId] = useState<string | null>(null);
  const [extractJobId, setExtractJobId] = useState<string | null>(null);
  // The failed job's own `error_summary`, kept so the failure screens can say
  // what actually went wrong instead of only the generic copy. Empty when the
  // backend sent none.
  const [errorSummary, setErrorSummary] = useState('');
  // The finished extraction job, so the done screen can report what actually
  // happened (how many pages made it in, how many failed or were skipped)
  // instead of a bare "queued for indexing" with no numbers.
  const [extractionResult, setExtractionResult] = useState<CrawlJob | null>(null);

  const discoverMutation = useAuthMutation<
    ApiResponse<WebsiteDiscoverResult>,
    WebsiteDiscoverInput
  >();
  const extractMutation = useAuthMutation<ApiResponse<CrawlJob>, undefined>();

  const reset = useCallback(() => {
    setStep('form');
    setWebsiteSourceId(null);
    setDiscoverJobId(null);
    setExtractJobId(null);
    setErrorSummary('');
    setExtractionResult(null);
  }, []);

  const discover = useCallback(
    async (values: WebsiteDiscoverSubmitValues) => {
      const scope_config = buildScopeConfig(values);
      const input: WebsiteDiscoverInput = {
        root_url: values.root_url,
        ...(scope_config && { scope_config }),
      };
      try {
        const response = await discoverMutation.mutateAsync({
          url: KNOWLEDGE_WEBSITE_DISCOVER_ENDPOINT,
          body: input,
        });
        onCreated?.(response.data.source.id);
        setWebsiteSourceId(response.data.crawl_job.website_source);
        setDiscoverJobId(response.data.crawl_job.id);
        setStep('discovering');
        return true;
      } catch (error) {
        applyApiError(error);
        return false;
      }
    },
    [discoverMutation, onCreated]
  );

  /** Called by the dialog once `useCrawlJob` reports the discovery run is done. */
  const onDiscoveryFinished = useCallback((job: CrawlJob) => {
    setErrorSummary(job.error_summary);
    setStep(job.status === 'completed' ? 'review' : 'discovery-failed');
  }, []);

  const extract = useCallback(async () => {
    if (!websiteSourceId) return false;
    try {
      const response = await extractMutation.mutateAsync({
        url: websiteExtractEndpoint(websiteSourceId),
      });
      setExtractJobId(response.data.id);
      setStep('extracting');
      return true;
    } catch (error) {
      applyApiError(error);
      return false;
    }
  }, [websiteSourceId, extractMutation]);

  /** Called by the dialog once `useCrawlJob` reports the extraction run is done. */
  const onExtractionFinished = useCallback(
    (job: CrawlJob) => {
      setErrorSummary(job.error_summary);
      setExtractionResult(job);
      if (job.status === 'completed') {
        void queryClient.invalidateQueries({ queryKey: knowledgeSourcesListKey() });
        // A successful extraction also updates this source's own page list
        // (statuses move off `discovered`) and kicks off a background index
        // rebuild (`_trigger_index_rebuild_for_source_safely`) for every
        // agent the source feeds — without these, "View pages" and the
        // index/health panels keep showing their pre-extraction snapshot
        // until the operator reloads the page.
        if (websiteSourceId) {
          void queryClient.invalidateQueries({ queryKey: discoveredUrlsKey(websiteSourceId) });
        }
        void queryClient.invalidateQueries({ queryKey: indexVersionsListKey(agentId) });
        void queryClient.invalidateQueries({ queryKey: knowledgeHealthKey(agentId) });
        setStep('done');
      } else {
        setStep('extraction-failed');
      }
    },
    [queryClient, agentId, websiteSourceId]
  );

  return {
    step,
    websiteSourceId,
    discoverJobId,
    extractJobId,
    errorSummary,
    extractionResult,
    reset,
    discover,
    isDiscovering: discoverMutation.isPending,
    onDiscoveryFinished,
    extract,
    isExtracting: extractMutation.isPending,
    onExtractionFinished,
  };
}
