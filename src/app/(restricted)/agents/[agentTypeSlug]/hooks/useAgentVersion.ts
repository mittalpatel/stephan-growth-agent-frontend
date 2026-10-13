'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { agentVersionDetailEndpoint, agentVersionDetailKey } from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { AgentVersionDetail } from '@/types/agent';

/**
 * One version's full record via `GET /agents/{id}/versions/{version_id}/`.
 * The Test tab reads the published version through this when there is no
 * draft, since the agent payload only carries a version summary.
 */
export function useAgentVersion(agentId: string, versionId: string | undefined) {
  const query = useAuthQuery<ApiResponse<AgentVersionDetail>>(
    agentVersionDetailKey(agentId, versionId ?? ''),
    agentVersionDetailEndpoint(agentId, versionId ?? ''),
    { enabled: Boolean(agentId && versionId) }
  );
  return { version: query.data?.data, isLoading: query.isLoading };
}
