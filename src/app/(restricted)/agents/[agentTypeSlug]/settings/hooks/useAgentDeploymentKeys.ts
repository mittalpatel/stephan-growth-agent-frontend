'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { t } from '@/locales';
import { agentKeyRevokeEndpoint, agentKeysEndpoint, agentKeysKey } from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { AgentDeploymentKey } from '@/types/agent';

/**
 * `GET /agents/{id}/keys/` landed 2026-09-07, same gap-closure as
 * `useAgentDomains`. Read + revoke only: key creation used to live here too
 * (`issueKey`, minting via `POST /agents/{id}/keys/`), but that was a second,
 * redundant way to create the same kind of credential `useAgentEmbedCode`
 * already mints via `POST /agents/{id}/embed-code/` — the only difference
 * was this one didn't hand back a usable snippet, just a bare secret. Removed
 * 2026-09-09 so there's exactly one place that creates a key.
 */
export function useAgentDeploymentKeys(agentId: string) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canView = can('agent', 'view');
  const canManage = can('agent', 'manage');

  const query = useAuthQuery<ApiResponse<AgentDeploymentKey[]>>(
    agentKeysKey(agentId),
    agentKeysEndpoint(agentId),
    { enabled: Boolean(agentId) && canView }
  );

  const revokeMutation = useAuthMutation<ApiResponse<AgentDeploymentKey>, undefined>();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const revokeKey = async (keyId: string) => {
    setRevokingId(keyId);
    try {
      await revokeMutation.mutateAsync({
        url: agentKeyRevokeEndpoint(agentId, keyId),
      });
      void queryClient.invalidateQueries({ queryKey: agentKeysKey(agentId) });
      toast.success(t.agents.settings.keys.revoked);
    } catch (error) {
      applyApiError(error);
    } finally {
      setRevokingId(null);
    }
  };

  return {
    keys: query.data?.data ?? [],
    canManage,
    isLoading: canView && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    revokeKey,
    revokingId,
  };
}
