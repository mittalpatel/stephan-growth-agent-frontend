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
import type { AgentDeploymentKey, AgentDeploymentKeyIssued } from '@/types/agent';

/**
 * `GET /agents/{id}/keys/` landed 2026-09-07, same gap-closure as
 * `useAgentDomains`. `issuedKey` stays local state, not part of the query:
 * the raw secret is genuinely one-time and never appears in a GET response,
 * so there's nothing to invalidate it against.
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

  const [issuedKey, setIssuedKey] = useState<AgentDeploymentKeyIssued | null>(null);
  const issueMutation = useAuthMutation<ApiResponse<AgentDeploymentKeyIssued>, undefined>();
  const revokeMutation = useAuthMutation<ApiResponse<AgentDeploymentKey>, undefined>();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const issueKey = async () => {
    try {
      const result = await issueMutation.mutateAsync({ url: agentKeysEndpoint(agentId) });
      void queryClient.invalidateQueries({ queryKey: agentKeysKey(agentId) });
      setIssuedKey(result.data);
    } catch (error) {
      applyApiError(error);
    }
  };

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
    issueKey,
    isIssuing: issueMutation.isPending,
    issuedKey,
    dismissIssuedKey: () => setIssuedKey(null),
    revokeKey,
    revokingId,
  };
}
