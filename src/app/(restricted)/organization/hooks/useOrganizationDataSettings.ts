'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { downloadBlob } from '@/lib/downloadBlob';
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
 *
 * The history read is gated client-side on `organization:export` because the
 * backend gates the endpoint itself on it (`OrgDataExportListCreateView`'s
 * `method_permissions`) — firing it unconditionally would 403 on every render
 * for the (common) member who can see this settings page but not export it.
 */
export function useOrganizationDataSettings() {
  const { can } = usePermissions();
  const canExport = can('organization', 'export');
  const canDelete = can('organization', 'delete');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const query = useAuthQuery<ApiResponse<OrgDataExport[]>>(
    [SETTINGS_DATA_EXPORT_KEY],
    SETTINGS_DATA_EXPORT_ENDPOINT,
    { enabled: canExport }
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

  /**
   * `downloadBlob` (not a hand-rolled object URL) so the ZIP is saved under the
   * server's own `Content-Disposition` filename and, more importantly, so a
   * failure surfaces the real backend message: the error body arrives as a Blob
   * here, which `applyApiError` alone cannot read. The 404 an export that isn't
   * `ready` yet returns is exactly that case.
   */
  const downloadExport = async (id: string) => {
    setDownloadingId(id);
    try {
      await downloadBlob(settingsDataExportDownloadEndpoint(id), `export-${id}.zip`);
    } catch (error) {
      applyApiError(error);
    } finally {
      setDownloadingId(null);
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
    isLoading: canExport && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    canExport,
    canDelete,
    requestExport,
    downloadExport: (id: string) => void downloadExport(id),
    downloadingId,
    requestDelete,
    isPending,
  };
}
