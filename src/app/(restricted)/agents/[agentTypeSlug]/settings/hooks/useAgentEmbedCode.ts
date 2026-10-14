'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import { agentEmbedCodeEndpoint, agentKeysKey } from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { AgentEmbedCode } from '@/types/agent';

/**
 * `POST /agents/{id}/embed-code/` mints a fresh deployment key each call and
 * returns a ready-to-paste snippet — this is the **only** place a key gets
 * created now (2026-09-09; `useAgentDeploymentKeys`' own `issueKey` was
 * removed as a redundant second way to mint the same kind of credential).
 * `embedCode` stays local state rather than a cached query: the snippet
 * embeds a one-time raw secret, so there's nothing to invalidate against and
 * no reason to refetch it. The newly-minted key itself, though, needs
 * `agentKeysKey` invalidated so `DeploymentKeysSection`'s list picks it up.
 */
export function useAgentEmbedCode(agentId: string) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canManage = can('agent', 'manage');

  const [embedCode, setEmbedCode] = useState<AgentEmbedCode | null>(null);
  const generateMutation = useAuthMutation<ApiResponse<AgentEmbedCode>, undefined>();

  // A ref, not `isPending`: a double click fires both handlers before the
  // re-render that disables the button, and minted two active keys (client
  // testing, 14 Oct 2026).
  const inFlight = useRef(false);

  const generate = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const result = await generateMutation.mutateAsync({
        url: agentEmbedCodeEndpoint(agentId),
      });
      setEmbedCode(result.data);
      void queryClient.invalidateQueries({ queryKey: agentKeysKey(agentId) });
    } catch (error) {
      applyApiError(error);
    } finally {
      inFlight.current = false;
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
