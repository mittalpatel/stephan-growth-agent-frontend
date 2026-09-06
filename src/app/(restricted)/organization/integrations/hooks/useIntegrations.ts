'use client';

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
import type { IntegrationCatalogItem } from '@/types/integration';
import { t } from '@/locales';

/** Never cached server-side; list + connect/disconnect for the whole catalog. */
export function useIntegrations() {
  const queryClient = useQueryClient();

  const listQuery = useAuthQuery<ApiResponse<IntegrationCatalogItem[]>>(
    [INTEGRATIONS_LIST_KEY],
    INTEGRATIONS_ENDPOINT
  );

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: [INTEGRATIONS_LIST_KEY] });

  const connectMutation = useAuthMutation<ApiResponse<IntegrationCatalogItem>>({
    onSuccess: () => {
      toast.success(t.integrations.toast.connected);
      invalidate();
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  const disconnectMutation = useAuthMutation<ApiResponse<IntegrationCatalogItem>>({
    onSuccess: () => {
      toast.success(t.integrations.toast.disconnected);
      invalidate();
    },
    onError: (error) => toast.error(getAxiosError(error)),
  });

  return {
    integrations: listQuery.data?.data ?? [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    refetch: listQuery.refetch,
    connect: (id: string) =>
      connectMutation.mutateAsync({ url: integrationConnectEndpoint(id), body: {} }),
    isConnecting: connectMutation.isPending,
    disconnect: (id: string) =>
      disconnectMutation.mutateAsync({ url: integrationDisconnectEndpoint(id) }),
    isDisconnecting: disconnectMutation.isPending,
  };
}
