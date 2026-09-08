'use client';

import { useState } from 'react';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { agentAnalyticsSummaryEndpoint, analyticsSummaryKey } from '@/services/conversations';
import type { ApiResponse } from '@/types/api';
import type { AnalyticsRange, AnalyticsSummary } from '@/types/conversation';

const DEFAULT_RANGE: AnalyticsRange = '30d';

/**
 * One agent's headline numbers, from
 * `GET /agents/{id}/analytics/summary/?range=…` — the same endpoint the
 * dashboard sums across every agent, read here for a single one.
 *
 * The range lives in component state rather than the URL: it's a reading
 * preference on one tab, not part of what a link to this agent points at.
 */
export function useAgentPerformance(agentId: string) {
  const [range, setRange] = useState<AnalyticsRange>(DEFAULT_RANGE);

  const query = useAuthQuery<ApiResponse<AnalyticsSummary>>(
    analyticsSummaryKey(agentId, range),
    `${agentAnalyticsSummaryEndpoint(agentId)}?range=${range}`,
    { enabled: Boolean(agentId) }
  );

  return {
    summary: query.data?.data,
    range,
    setRange,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
