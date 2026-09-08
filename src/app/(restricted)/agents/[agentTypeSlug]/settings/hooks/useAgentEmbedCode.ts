'use client';

import { useState } from 'react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import { agentEmbedCodeEndpoint } from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { AgentEmbedCode } from '@/types/agent';

/**
 * `POST /agents/{id}/embed-code/` mints a fresh deployment key each call and
 * returns a ready-to-paste snippet. Kept as local state rather than a cached
 * query, same rationale as `issuedKey` in `useAgentDeploymentKeys`: the
 * snippet embeds a one-time raw secret, so there's nothing to invalidate
 * against and no reason to refetch it.
 */
export function useAgentEmbedCode(agentId: string) {
  const { can } = usePermissions();
  const canManage = can('agent', 'manage');

  const [embedCode, setEmbedCode] = useState<AgentEmbedCode | null>(null);
  const generateMutation = useAuthMutation<ApiResponse<AgentEmbedCode>, undefined>();

  const generate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        url: agentEmbedCodeEndpoint(agentId),
      });
      setEmbedCode(result.data);
    } catch (error) {
      applyApiError(error);
    }
  };

  return {
    canManage,
    embedCode,
    generate,
    isGenerating: generateMutation.isPending,
    dismissEmbedCode: () => setEmbedCode(null),
  };
}
