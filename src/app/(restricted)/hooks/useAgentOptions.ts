'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { AGENTS_ENDPOINT } from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { AgentListItem } from '@/types/agent';

const AGENT_OPTIONS_KEY = ['agent-options'];
/** Large enough that the picker never needs its own pagination — Sprint 1
 * orgs run a handful of agents each. */
const AGENT_OPTIONS_URL = `${AGENTS_ENDPOINT}?page_size=200`;

/**
 * A lightweight, unpaginated agent list for pickers (the conversations page's
 * agent selector, the dashboard's cross-agent analytics loop) that need
 * `{id, name}` and nothing else from `useAgentsList`'s full toolbar state.
 */
export function useAgentOptions() {
  const query = useAuthQuery<ApiResponse<AgentListItem[]>>(AGENT_OPTIONS_KEY, AGENT_OPTIONS_URL, {
    staleTime: 60 * 1000,
  });

  return {
    agents: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
