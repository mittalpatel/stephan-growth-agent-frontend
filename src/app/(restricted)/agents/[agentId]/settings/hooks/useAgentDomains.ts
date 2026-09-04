'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import { t } from '@/locales';
import { agentDomainDeleteEndpoint, agentDomainsEndpoint } from '@/services/agents';
import type { ApiResponse } from '@/types/api';
import type { AllowedDomain } from '@/types/agent';
import type { AgentDomainCreateFormValues } from '@/lib/schemas/agent';

/**
 * There is no `GET /agents/{id}/domains/` endpoint (only create/delete), so
 * `domains` is plain component state seeded by this session's own adds, not
 * a query cache — it cannot show domains configured before this page loaded.
 * See `context/app/(restricted)/agents/[agentId]/settings/page.md`.
 */
export function useAgentDomains(agentId: string) {
  const [domains, setDomains] = useState<AllowedDomain[]>([]);
  const addMutation = useAuthMutation<ApiResponse<AllowedDomain>, { hostname: string }>();
  const removeMutation = useAuthMutation<ApiResponse<null>, undefined>();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const addDomain = async (
    hostname: string,
    setError?: (field: keyof AgentDomainCreateFormValues, error: { message: string }) => void
  ) => {
    try {
      const result = await addMutation.mutateAsync({
        url: agentDomainsEndpoint(agentId),
        body: { hostname },
      });
      setDomains((previous) => [...previous, result.data]);
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
      setDomains((previous) => previous.filter((domain) => domain.id !== domainId));
      toast.success(t.agents.settings.domains.removed);
    } catch (error) {
      applyApiError(error);
    } finally {
      setRemovingId(null);
    }
  };

  return {
    domains,
    addDomain,
    isAdding: addMutation.isPending,
    removeDomain,
    removingId,
  };
}
