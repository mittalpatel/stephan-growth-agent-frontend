'use client';

import { toast } from 'sonner';

import axiosAuth from '@/client/axiosAuth';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import {
  SETTINGS_DATA_DELETE_ENDPOINT,
  SETTINGS_DATA_EXPORT_ENDPOINT,
  SETTINGS_DATA_EXPORT_KEY,
  settingsDataExportDownloadEndpoint,
} from '@/services/settings';
import type { ApiResponse } from '@/types/api';
import type { OrgDataExport } from '@/types/settings';
import { t } from '@/locales';

/**
 * Export history + request, and the delete-organization email-confirm flow.
 * Confirming the delete token happens on a dedicated page
 * (`/organization/data-delete-confirm`), since the link is emailed and opened
 * outside this session's normal navigation.
 */
export function useOrganizationDataSettings() {
  const query = useAuthQuery<ApiResponse<OrgDataExport[]>>(
    [SETTINGS_DATA_EXPORT_KEY],
    SETTINGS_DATA_EXPORT_ENDPOINT
  );
  const { mutateAsync: mutate, isPending } = useAuthMutation();

  const requestExport = async () => {
    try {
      await mutate({ url: SETTINGS_DATA_EXPORT_ENDPOINT, body: {} });
      toast.success(t.organizations.settingsTabs.data.exportRequested);
      await query.refetch();
    } catch (error) {
      applyApiError(error);
    }
  };

  const downloadExport = async (id: string) => {
    try {
      const response = await axiosAuth.get(settingsDataExportDownloadEndpoint(id), {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `export-${id}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      applyApiError(error);
    }
  };

  const requestDelete = async () => {
    try {
      await mutate({ url: SETTINGS_DATA_DELETE_ENDPOINT, body: {} });
      toast.success(t.organizations.settingsTabs.data.deleteRequested);
    } catch (error) {
      applyApiError(error);
    }
  };

  return {
    exports: query.data?.data ?? [],
    isLoading: query.isLoading,
    requestExport,
    downloadExport: (id: string) => void downloadExport(id),
    requestDelete,
    isPending,
  };
}
