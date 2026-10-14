'use client';

import type { UseFormSetError } from 'react-hook-form';
import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { format } from '@/lib/i18n';
import { applyApiError, getEnvelope } from '@/lib/apiError';
import { getErrorCode } from '@/lib/helper';
import { t } from '@/locales';
import type {
  WebsiteDiscoverFormValues,
  WebsiteDiscoverSubmitValues,
} from '@/lib/schemas/knowledge';
import {
  discoveredUrlsKey,
  indexVersionsListKey,
  knowledgeHealthKey,
  KNOWLEDGE_UPLOAD_LIMITS_ENDPOINT,
  KNOWLEDGE_UPLOAD_LIMITS_KEY,
  KNOWLEDGE_WEBSITE_DISCOVER_ENDPOINT,
  knowledgeSourcesListKey,
  websiteExtractEndpoint,
} from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type {
  CrawlJob,
  KnowledgeSourceListItem,
  KnowledgeUploadLimits,
  WebsiteDiscoverInput,
  WebsiteDiscoverResult,
} from '@/types/knowledge';

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
  | 'reading'
  | 'review'
  | 'extracting'
  | 'done'
  | 'discovery-failed'
  | 'extraction-failed';

/**
 * Orchestrates the multi-step add-website dialog. Two paths (2026-10-13):
 *
 * - "Read the whole website" (`read_mode: 'all'`, the default): one call with
 *   `auto_extract: true`, and the backend reads every found page by itself.
 *   The dialog only watches the source (`reading`), so closing it is safe.
 * - "Let me choose the pages": discover → poll → review → extract → poll →
 *   done, as before.
 * Holds only the ids the next step needs
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
  /** `KnowledgeSource.id` of the source this run created, watched by `reading`. */
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [discoverJobId, setDiscoverJobId] = useState<string | null>(null);
  const [extractJobId, setExtractJobId] = useState<string | null>(null);
  // The failed job's own `error_summary`, kept so the failure screens can say
  // what actually went wrong instead of only the generic copy. Empty when the
  // backend sent none.
  const [errorSummary, setErrorSummary] = useState('');
  // Whether the read-everything path ever saw a page. A failure before the
  // first one means the address had nothing readable, which is a different
  // message from a read that broke part way.
  const [sawPages, setSawPages] = useState(false);
  /** `KnowledgeSource.id` of the source that already covers this root URL, set
   * only by a `duplicate_website_source` 409. Not a `WebsiteSource.id`, so the
   * consumer resolves it before routing. */
  const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(null);

  const discoverMutation = useAuthMutation<
    ApiResponse<WebsiteDiscoverResult>,
    WebsiteDiscoverInput
  >();
  const extractMutation = useAuthMutation<ApiResponse<CrawlJob>, undefined>();

  const reset = useCallback(() => {
    setStep('form');
    setWebsiteSourceId(null);
    setSourceId(null);
    setDiscoverJobId(null);
    setExtractJobId(null);
    setErrorSummary('');
    setDuplicateSourceId(null);
    setSawPages(false);
  }, []);

  const discover = useCallback(
    async (
      values: WebsiteDiscoverSubmitValues,
      setError?: UseFormSetError<WebsiteDiscoverFormValues>
    ) => {
      const scope_config = buildScopeConfig(values);
      const autoExtract = values.read_mode === 'all';
      const input: WebsiteDiscoverInput = {
        root_url: values.root_url,
        auto_extract: autoExtract,
        ...(scope_config && { scope_config }),
      };
      setDuplicateSourceId(null);
      try {
        const response = await discoverMutation.mutateAsync({
          url: KNOWLEDGE_WEBSITE_DISCOVER_ENDPOINT,
          body: input,
        });
        onCreated?.(response.data.source.id);
        setSourceId(response.data.source.id);
        setWebsiteSourceId(response.data.crawl_job.website_source);
        setDiscoverJobId(response.data.crawl_job.id);
        setStep(autoExtract ? 'reading' : 'discovering');
        // The new source is in progress: wake the app-wide list (and the
        // progress bar polling it) now rather than at its next interval.
        void queryClient.invalidateQueries({ queryKey: knowledgeSourcesListKey() });
        return true;
      } catch (error) {
        // The backend's own message for this 409 is already the full
        // actionable sentence, so `applyApiError` still toasts it as before.
        // What it can't do is act on `errors.existing_source_id`: until the
        // per-source page route existed (2026-09-11) there was nowhere to send
        // the operator, so the id was read by nothing. Capturing it here turns
        // "this is already added" into a way to go open it.
        if (getErrorCode(error) === 'duplicate_website_source') {
          const existing = getEnvelope(error)?.errors as
            | { existing_source_id?: string }
            | undefined;
          setDuplicateSourceId(existing?.existing_source_id ?? null);
        }
        // A refused address (wrong scheme, private network, host not found)
        // comes back on `root_url`; shown under the field it says what to
        // change, where a toast said only "The submitted data is invalid".
        applyApiError<WebsiteDiscoverFormValues>(error, { setError, fields: ['root_url'] });
        return false;
      }
    },
    [discoverMutation, onCreated, queryClient]
  );

  /**
   * Called by the `reading` screen each time the watched source changes.
   * Ends on ready or failed. A source that lands on `choosing` had its
   * automatic read refused (a plan page limit, or no pages selected), so the
   * user gets the review step they would have had without it.
   */
  const onReadingUpdate = useCallback(
    (source: KnowledgeSourceListItem) => {
      const seen =
        sawPages || Boolean(source.progress?.pages_found || source.progress?.pages_total);
      if (seen !== sawPages) setSawPages(seen);
      if (source.status === 'failed' && !seen) {
        setErrorSummary(t.knowledge.list.failedHint);
        setStep('discovery-failed');
      } else if (source.status === 'ready') {
        void queryClient.invalidateQueries({ queryKey: indexVersionsListKey(agentId) });
        void queryClient.invalidateQueries({ queryKey: knowledgeHealthKey(agentId) });
        if (websiteSourceId) {
          void queryClient.invalidateQueries({ queryKey: discoveredUrlsKey(websiteSourceId) });
        }
        setStep('done');
      } else if (source.status === 'failed') {
        setStep('extraction-failed');
      } else if (source.progress?.stage === 'choosing') {
        setStep('review');
      }
    },
    [queryClient, agentId, websiteSourceId, sawPages]
  );

  /** Called by the dialog once `useCrawlJob` reports the discovery run is done. */
  const onDiscoveryFinished = useCallback((job: CrawlJob) => {
    // A first discovery that found nothing fails the source (backend
    // 2026-10-13); an empty review list would leave nothing to do.
    const foundNothing = job.status === 'completed' && job.discovered_count === 0;
    setErrorSummary(foundNothing ? t.knowledge.list.failedHint : job.error_summary);
    setStep(job.status === 'completed' && !foundNothing ? 'review' : 'discovery-failed');
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

  // Same cached read as the PDF dialog's. States the page ceiling up front:
  // a read used to stop at 50 pages without saying so (client testing,
  // 14 Oct 2026).
  const limitsQuery = useAuthQuery<ApiResponse<KnowledgeUploadLimits>>(
    [KNOWLEDGE_UPLOAD_LIMITS_KEY],
    KNOWLEDGE_UPLOAD_LIMITS_ENDPOINT,
    { staleTime: Infinity }
  );
  const maxPages = limitsQuery.data?.data.max_discovered_pages ?? null;

  return {
    maxPagesHint:
      maxPages === null
        ? t.knowledge.addWebsite.scope.maxPagesDescription
        : format(t.knowledge.addWebsite.scope.maxPagesDescriptionWithLimit, { limit: maxPages }),
    step,
    websiteSourceId,
    sourceId,
    discoverJobId,
    extractJobId,
    errorSummary,
    reset,
    discover,
    isDiscovering: discoverMutation.isPending,
    duplicateSourceId,
    onDiscoveryFinished,
    onReadingUpdate,
    extract,
    isExtracting: extractMutation.isPending,
    onExtractionFinished,
  };
}
