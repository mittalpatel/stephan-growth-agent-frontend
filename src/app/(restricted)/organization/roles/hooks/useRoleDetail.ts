'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useInvalidateCache } from '@/hooks/useInvalidateCache';
import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { applyApiError } from '@/lib/apiError';
import {
  organizationRolePermissionsEndpoint,
  organizationRoleResetEndpoint,
  organizationRolesKey,
  roleDetailEndpoint,
  roleDetailKey,
} from '@/services/organizations';
import { t } from '@/locales';
import type { OrganizationRole } from '../types';
import { usePermissionCatalog } from '../../hooks/usePermissionCatalog';

const ROLES_LIST_PATH = '/organization/roles';

/**
 * One role and everything the editor page does to it.
 *
 * System roles are editable here too, not just custom ones — see the backend's
 * `RBACService.assert_role_editable`. Only deletion stays exclusive to custom
 * roles; a system role offers "reset to defaults" instead.
 */
export function useRoleDetail(roleId: string) {
  const router = useRouter();
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? '';
  const { catalog, isCatalogLoading, isGrantable } = usePermissionCatalog();
  const { invalidate } = useInvalidateCache();

  const roleQuery = useAuthQuery<{ data: OrganizationRole }>(
    roleDetailKey(roleId),
    roleDetailEndpoint(roleId),
    {
      enabled: Boolean(roleId),
      // A 404 means the role is gone or belongs to another tenant — neither
      // improves on retry, and retrying just delays the not-found state.
      retry: (failureCount, error) => error.response?.status !== 404 && failureCount < 2,
    }
  );

  const { mutateAsync, isPending } = useAuthMutation();

  /**
   * Follows a fork: editing a global system role forks it into an org-owned
   * copy on first write (see the backend's `RBACService._fork_or_get_org_role`),
   * which changes the role's id. `RoleSelector` then shadows the original
   * global id for this organization, so any further request against it 404s.
   * Redirecting to the fork's id keeps this page (and the next save) working.
   */
  const followFork = useCallback(
    (nextId: string) => {
      if (nextId === roleId) return false;
      router.replace(`/organization/roles/${nextId}`);
      return true;
    },
    [roleId, router]
  );

  /** Name/description and the full permission set, saved as one action. */
  const save = useCallback(
    async (body: { name: string; description: string }, codes: string[]) => {
      try {
        const patched = (await mutateAsync({
          url: roleDetailEndpoint(roleId),
          body,
          method: 'patch',
        })) as { data: OrganizationRole };
        // Both requests must target the same role instance — once the PATCH
        // above forks, the original id is no longer visible to this org.
        const effectiveId = patched.data.id;
        await mutateAsync({
          url: organizationRolePermissionsEndpoint(effectiveId),
          body: { permission_codes: codes },
          method: 'put',
        });
        toast.success(t.organizations.roles.updated);
        // Both entries: this page's own copy, and the list the user returns to —
        // its cards show each role's permission count, which just changed.
        await invalidate(...organizationRolesKey(organizationId));
        if (!followFork(effectiveId)) await roleQuery.refetch();
        return true;
      } catch (error) {
        applyApiError(error);
        return false;
      }
    },
    [mutateAsync, roleId, roleQuery, invalidate, organizationId, followFork]
  );

  const reset = useCallback(async () => {
    try {
      const response = (await mutateAsync({
        url: organizationRoleResetEndpoint(roleId),
        method: 'post',
      })) as { data: OrganizationRole };
      toast.success(t.organizations.roles.resetDone);
      await invalidate(...organizationRolesKey(organizationId));
      if (!followFork(response.data.id)) await roleQuery.refetch();
      return true;
    } catch (error) {
      applyApiError(error);
      return false;
    }
  }, [mutateAsync, roleId, roleQuery, invalidate, organizationId, followFork]);

  const remove = useCallback(async () => {
    try {
      await mutateAsync({ url: roleDetailEndpoint(roleId), method: 'delete' });
      toast.success(t.organizations.roles.deleted);
      // The list query is stale the moment this succeeds, and the user is about
      // to land on it — invalidate before navigating, not after, or the list
      // renders the deleted role for a frame.
      await invalidate(...organizationRolesKey(organizationId));
      router.push(ROLES_LIST_PATH);
      return true;
    } catch (error) {
      applyApiError(error);
      return false;
    }
  }, [mutateAsync, roleId, router, organizationId, invalidate]);

  return {
    role: roleQuery.data?.data,
    catalog,
    isGrantable,
    isLoading: roleQuery.isLoading || isCatalogLoading,
    isError: roleQuery.isError,
    isNotFound: roleQuery.error?.response?.status === 404,
    isSubmitting: isPending,
    save,
    reset,
    remove,
  };
}
