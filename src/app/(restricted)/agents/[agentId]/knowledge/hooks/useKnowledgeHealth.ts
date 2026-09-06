'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { agentKnowledgeHealthEndpoint, knowledgeHealthKey } from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';

/** `KnowledgeSourceSelector.get_health_summary` — never cached, always live. */
export type KnowledgeHealth = {
  score: number;
  last_updated: string | null;
  sources: number;
  indexed_chunks: number;
};

export function useKnowledgeHealth(agentId: string) {
  const query = useAuthQuery<ApiResponse<KnowledgeHealth>>(
    knowledgeHealthKey(agentId),
    agentKnowledgeHealthEndpoint(agentId)
  );

  return { health: query.data?.data, isLoading: query.isLoading };
}
