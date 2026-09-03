'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { applyApiError } from '@/lib/apiError';
import { organizationRolesEndpoint, organizationRolesKey } from '@/services/organizations';
import { t } from '@/locales';
import type { OrganizationRole } from '../types';
import { usePermissionCatalog } from '../../hooks/usePermissionCatalog';

/**
 * Every role assignable in this organization, for the list screen.
 *
 * Editing one is `useRoleDetail` on its own page — the list deliberately does
 * not carry the editor's state, so navigating between roles cannot leave a
 * half-edited permission set behind.
 */
export function useOrganizationRoles() {
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? '';
  const { catalog, isCatalogLoading, isGrantable } = usePermissionCatalog();

  const rolesQuery = useAuthQuery<{ data: OrganizationRole[] }>(
    organizationRolesKey(organizationId),
    organizationRolesEndpoint(organizationId),
    { enabled: Boolean(organizationId) }
  );

  const { mutateAsync, isPending } = useAuthMutation();

  const createRole = useCallback(
    async (body: { name: string; description?: string; permission_codes: string[] }) => {
      try {
        await mutateAsync({ url: organizationRolesEndpoint(organizationId), body });
        toast.success(t.organizations.roles.created);
        await rolesQuery.refetch();
        return true;
      } catch (error) {
        applyApiError(error);
        return false;
      }
    },
    [mutateAsync, organizationId, rolesQuery]
  );

  const roles = useMemo(() => rolesQuery.data?.data ?? [], [rolesQuery.data]);

  return {
    organization,
    roles,
    catalog,
    isLoading: rolesQuery.isLoading || isCatalogLoading,
    isSubmitting: isPending,
    isGrantable,
    createRole,
  };
}
