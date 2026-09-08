'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { t } from '@/locales';
import {
  agentDomainDeleteEndpoint,
  agentDomainsEndpoint,
  agentDomainsKey,
} from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { AllowedDomain } from '@/types/agent';
import type { AgentDomainCreateFormValues } from '@/lib/schemas/agent';

/**
 * `GET /agents/{id}/domains/` landed 2026-09-07 (backend audit-fix round),
 * closing what was previously a real gap: this list used to be seeded only
 * by what the current session added, with no way to see domains configured
 * earlier. It's a proper query now, gated `agent:view` like the read side of
 * every other agent-nested resource.
 */
export function useAgentDomains(agentId: string) {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canView = can('agent', 'view');
  const canManage = can('agent', 'manage');

  const query = useAuthQuery<ApiResponse<AllowedDomain[]>>(
    agentDomainsKey(agentId),
    agentDomainsEndpoint(agentId),
    { enabled: Boolean(agentId) && canView }
  );

  const addMutation = useAuthMutation<ApiResponse<AllowedDomain>, { hostname: string }>();
  const removeMutation = useAuthMutation<ApiResponse<null>, undefined>();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const addDomain = async (
    hostname: string,
    setError?: (field: keyof AgentDomainCreateFormValues, error: { message: string }) => void
  ) => {
    try {
      await addMutation.mutateAsync({
        url: agentDomainsEndpoint(agentId),
        body: { hostname },
      });
      void queryClient.invalidateQueries({ queryKey: agentDomainsKey(agentId) });
      toast.success(t.agents.settings.domains.added);
      return true;
    } catch (error) {
      applyApiError<AgentDomainCreateFormValues>(error, { setError, fields: ['hostname'] });
      return false;
    }
  };

  const removeDomain = async (domainId: string) => {
    setRemovingId(domainId);
    try {
      await removeMutation.mutateAsync({
        url: agentDomainDeleteEndpoint(agentId, domainId),
        method: 'delete',
      });
      void queryClient.invalidateQueries({ queryKey: agentDomainsKey(agentId) });
      toast.success(t.agents.settings.domains.removed);
    } catch (error) {
      applyApiError(error);
    } finally {
      setRemovingId(null);
    }
  };

  return {
    domains: query.data?.data ?? [],
    canManage,
    isLoading: canView && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    addDomain,
    isAdding: addMutation.isPending,
    removeDomain,
    removingId,
  };
}
