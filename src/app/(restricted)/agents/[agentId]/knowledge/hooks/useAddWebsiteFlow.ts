'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import {
  agentWebsiteDiscoverEndpoint,
  knowledgeSourcesListKey,
  websiteExtractEndpoint,
} from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type { CrawlJob, WebsiteDiscoverInput, WebsiteDiscoverResult } from '@/types/knowledge';

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
 */
export function useAddWebsiteFlow(agentId: string) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<AddWebsiteStep>('form');
  const [websiteSourceId, setWebsiteSourceId] = useState<string | null>(null);
  const [discoverJobId, setDiscoverJobId] = useState<string | null>(null);
  const [extractJobId, setExtractJobId] = useState<string | null>(null);

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
  }, []);

  const discover = useCallback(
    async (input: WebsiteDiscoverInput) => {
      try {
        const response = await discoverMutation.mutateAsync({
          url: agentWebsiteDiscoverEndpoint(agentId),
          body: input,
        });
        setWebsiteSourceId(response.data.crawl_job.website_source);
        setDiscoverJobId(response.data.crawl_job.id);
        setStep('discovering');
        return true;
      } catch (error) {
        applyApiError(error);
        return false;
      }
    },
    [agentId, discoverMutation]
  );

  /** Called by the dialog once `useCrawlJob` reports the discovery run is done. */
  const onDiscoveryFinished = useCallback((job: CrawlJob) => {
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
      if (job.status === 'completed') {
        void queryClient.invalidateQueries({ queryKey: knowledgeSourcesListKey(agentId) });
        setStep('done');
      } else {
        setStep('extraction-failed');
      }
    },
    [agentId, queryClient]
  );

  return {
    step,
    websiteSourceId,
    discoverJobId,
    extractJobId,
    reset,
    discover,
    isDiscovering: discoverMutation.isPending,
    onDiscoveryFinished,
    extract,
    isExtracting: extractMutation.isPending,
    onExtractionFinished,
  };
}
