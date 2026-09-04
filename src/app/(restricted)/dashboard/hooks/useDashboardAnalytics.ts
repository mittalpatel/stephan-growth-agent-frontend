'use client';

import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';

import axiosAuth from '@/client/axiosAuth';
import { useAgentOptions } from '@/app/(restricted)/hooks/useAgentOptions';
import { agentAnalyticsSummaryEndpoint, analyticsSummaryKey } from '@/services/conversations';
import type { ApiResponse } from '@/types/api';
import type { AnalyticsRange, AnalyticsSummary } from '@/types/conversation';

const EMPTY_SUMMARY: AnalyticsSummary = {
  conversation_count: 0,
  message_count: 0,
  escalation_count: 0,
  lead_count: 0,
  unresolved_topic_count: 0,
};

/**
 * Org-wide analytics as a client-side sum of each agent's
 * `GET /agents/{id}/analytics/summary/` — there is no org-wide aggregate
 * endpoint, so this loops over `useAgentOptions()`'s agents and adds up
 * their per-agent summaries (see the plan's Phase 3 note on this tradeoff).
 */
export function useDashboardAnalytics() {
  const [range, setRange] = useState<AnalyticsRange>('7d');
  const { agents, isLoading: agentsLoading } = useAgentOptions();

  const summaryQueries = useQueries({
    queries: agents.map((agent) => ({
      queryKey: analyticsSummaryKey(agent.id, range),
      queryFn: async () => {
        const { data } = await axiosAuth.get<ApiResponse<AnalyticsSummary>>(
          agentAnalyticsSummaryEndpoint(agent.id),
          { params: { range } }
        );
        return data;
      },
      enabled: agents.length > 0,
    })),
  });

  const isLoading = agentsLoading || summaryQueries.some((q) => q.isLoading);
  const isError = summaryQueries.some((q) => q.isError);

  const summary = useMemo(
    () =>
      summaryQueries.reduce<AnalyticsSummary>((total, query) => {
        const data = query.data?.data;
        if (!data) return total;
        return {
          conversation_count: total.conversation_count + data.conversation_count,
          message_count: total.message_count + data.message_count,
          escalation_count: total.escalation_count + data.escalation_count,
          lead_count: total.lead_count + data.lead_count,
          unresolved_topic_count: total.unresolved_topic_count + data.unresolved_topic_count,
        };
      }, EMPTY_SUMMARY),
    [summaryQueries]
  );

  const perAgent = useMemo(
    () =>
      agents.map((agent, index) => ({
        agent,
        summary: summaryQueries[index]?.data?.data ?? EMPTY_SUMMARY,
        isLoading: summaryQueries[index]?.isLoading ?? true,
      })),
    [agents, summaryQueries]
  );

  return { summary, perAgent, range, setRange, isLoading, isError, agentCount: agents.length };
}
