'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { agentCrawlJobDetailEndpoint, crawlJobKey } from '@/services/knowledge';
import { CRAWL_JOB_ACTIVE_STATUSES } from '@/types/knowledge';
import type { ApiResponse } from '@/types/api';
import type { CrawlJob } from '@/types/knowledge';

const POLL_INTERVAL_MS = 3000;

/**
 * Polls one crawl job until it leaves `pending`/`running`. Used for both the
 * discovery and extraction steps of the add-website flow — the two-step
 * workflow `apps/knowledge` documents (PLAN.md §7.5.1).
 */
export function useCrawlJob(agentId: string, jobId: string | null) {
  const query = useAuthQuery<ApiResponse<CrawlJob>>(
    crawlJobKey(agentId, jobId ?? ''),
    agentCrawlJobDetailEndpoint(agentId, jobId ?? ''),
    {
      enabled: Boolean(agentId) && Boolean(jobId),
      refetchInterval: (q) => {
        const status = q.state.data?.data.status;
        return status && !CRAWL_JOB_ACTIVE_STATUSES.includes(status) ? false : POLL_INTERVAL_MS;
      },
    }
  );

  const job = query.data?.data ?? null;

  return {
    job,
    isLoading: query.isLoading,
    isError: query.isError,
    isActive: Boolean(job && CRAWL_JOB_ACTIVE_STATUSES.includes(job.status)),
  };
}
