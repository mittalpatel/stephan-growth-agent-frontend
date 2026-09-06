'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { getAxiosError } from '@/lib/helper';
import {
  INTEGRATIONS_ENDPOINT,
  INTEGRATIONS_LIST_KEY,
  integrationConnectEndpoint,
  integrationDisconnectEndpoint,
} from '@/services/integrations';
import type { ApiResponse } from '@/types/api';
import type { IntegrationCatalogItem, OrgIntegrationStatusResponse } from '@/types/integration';
import { t } from '@/locales';

/**
 * The integrations catalog: one never-cached list read plus connect/disconnect.
 *
 * Pending state is tracked per integration id, not as one shared
 * `isPending` flag — the catalog renders every integration at once, and a
 * single flag would grey out every other card's button while one of them is
 * mid-request. Both mutations are fire-and-forget (`mutate`, which never
 * rejects) since nothing awaits them; errors surface through `onError`.
 */
export function useIntegrations() {
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const listQuery = useAuthQuery<ApiResponse<IntegrationCatalogItem[]>>(
    [INTEGRATIONS_LIST_KEY],
    INTEGRATIONS_ENDPOINT
  );

  const settle = () => setPendingId(null);
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: [INTEGRATIONS_LIST_KEY] });
  };

  const connectMutation = useAuthMutation<ApiResponse<OrgIntegrationStatusResponse>>({
    onSuccess: () => {
      toast.success(t.integrations.toast.connected);
      invalidate();
    },
    onError: (error) => toast.error(getAxiosError(error)),
    onSettled: settle,
  });

  const disconnectMutation = useAuthMutation<ApiResponse<OrgIntegrationStatusResponse>>({
    onSuccess: () => {
      toast.success(t.integrations.toast.disconnected);
      invalidate();
    },
    onError: (error) => toast.error(getAxiosError(error)),
    onSettled: settle,
  });

  return {
    integrations: listQuery.data?.data ?? [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    connect: (id: string) => {
      setPendingId(id);
      connectMutation.mutate({ url: integrationConnectEndpoint(id), body: {} });
    },
    disconnect: (id: string) => {
      setPendingId(id);
      disconnectMutation.mutate({ url: integrationDisconnectEndpoint(id) });
    },
    /** The integration currently mid-connect/disconnect, if any. */
    pendingId,
  };
}
