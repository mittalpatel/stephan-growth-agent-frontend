'use client';

import { useCallback, useMemo } from 'react';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import type { CatalogPermission } from '../roles/types';

const PERMISSIONS_CATALOG_ENDPOINT = '/api/v1/rbac/permissions/';
const PERMISSIONS_CATALOG_KEY = ['rbac-permissions'];

/**
 * The backend's permission catalog, plus the client-side ceiling check.
 *
 * Shared by the roles list/editor and the members-page override editor so all
 * three render the same catalog from one cache entry — permission codes are
 * backend-defined and constant, so a long `staleTime` costs nothing and saves
 * a refetch on every navigation between them.
 */
export function usePermissionCatalog() {
  const { permissions: heldCodes } = usePermissions();

  const catalogQuery = useAuthQuery<{ data: CatalogPermission[] }>(
    PERMISSIONS_CATALOG_KEY,
    PERMISSIONS_CATALOG_ENDPOINT,
    { staleTime: 5 * 60 * 1000 }
  );

  const catalog = useMemo(() => catalogQuery.data?.data ?? [], [catalogQuery.data]);

  /**
   * The client-side mirror of the backend's ceiling rule: you cannot grant a
   * permission you do not hold. Locking the row is a courtesy, not the control —
   * the service rejects an out-of-ceiling code regardless, which is what actually
   * stops an admin minting themselves an owner-level role.
   */
  const isGrantable = useCallback((code: string) => heldCodes.includes(code), [heldCodes]);

  return {
    catalog,
    isCatalogLoading: catalogQuery.isLoading,
    isGrantable,
  };
}
