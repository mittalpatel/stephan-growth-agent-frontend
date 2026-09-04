'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import { t } from '@/locales';
import { agentKeyRevokeEndpoint, agentKeysEndpoint } from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { AgentDeploymentKey, AgentDeploymentKeyIssued } from '@/types/agent';

/**
 * Same shape as `useAgentDomains`: there is no `GET /agents/{id}/keys/`
 * endpoint, so `keys` only ever holds what this session has issued. The raw
 * secret from a fresh issuance lives in `issuedKey` only, for the one-time
 * reveal dialog, and is discarded (never merged into `keys`) once dismissed.
 */
export function useAgentDeploymentKeys(agentId: string) {
  const [keys, setKeys] = useState<AgentDeploymentKey[]>([]);
  const [issuedKey, setIssuedKey] = useState<AgentDeploymentKeyIssued | null>(null);
  const issueMutation = useAuthMutation<ApiResponse<AgentDeploymentKeyIssued>, undefined>();
  const revokeMutation = useAuthMutation<ApiResponse<AgentDeploymentKey>, undefined>();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const issueKey = async () => {
    try {
      const result = await issueMutation.mutateAsync({ url: agentKeysEndpoint(agentId) });
      setKeys((previous) => [result.data, ...previous]);
      setIssuedKey(result.data);
    } catch (error) {
      applyApiError(error);
    }
  };

  const revokeKey = async (keyId: string) => {
    setRevokingId(keyId);
    try {
      const result = await revokeMutation.mutateAsync({
        url: agentKeyRevokeEndpoint(agentId, keyId),
      });
      setKeys((previous) => previous.map((key) => (key.id === keyId ? result.data : key)));
      toast.success(t.agents.settings.keys.revoked);
    } catch (error) {
      applyApiError(error);
    } finally {
      setRevokingId(null);
    }
  };

  return {
    keys,
    issueKey,
    isIssuing: issueMutation.isPending,
    issuedKey,
    dismissIssuedKey: () => setIssuedKey(null),
    revokeKey,
    revokingId,
  };
}
