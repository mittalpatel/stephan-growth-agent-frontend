'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useInvalidateCache } from '@/hooks/useInvalidateCache';
import { applyApiError } from '@/lib/apiError';
import {
  USER_OVERRIDE_ENDPOINT,
  userOverridesEndpoint,
  userOverridesKey,
  userPermissionsExplainKey,
  type OverrideEffect,
  type SetOverridePayload,
  type UserOverrideRow,
} from '@/services/organizations';
import { t } from '@/locales';

/**
 * Grant/revoke a specific permission for one member, without changing their
 * role — layers a direct override on top of whatever their role already
 * grants. See the backend's `RBACService.set_override`/`remove_override`;
 * DENY always wins over a role grant or a GRANT override.
 *
 * Ceiling-checked on the backend for GRANT (never for DENY — removing access
 * from someone is not a privilege an actor needs to hold themselves), so a
 * grant this component lets through can still come back as a 400.
 */
export function useMemberOverrides(userId: string) {
  const { invalidate } = useInvalidateCache();

  const overridesQuery = useAuthQuery<{ data: UserOverrideRow[] }>(
    userOverridesKey(userId),
    userOverridesEndpoint(userId),
    { enabled: Boolean(userId) }
  );

  const { mutateAsync, isPending } = useAuthMutation();

  const refresh = useCallback(async () => {
    await invalidate(...userOverridesKey(userId));
    // The effective-permissions view above this list changes too — a grant
    // or revoke here is exactly what it explains the source of.
    await invalidate(...userPermissionsExplainKey(userId));
  }, [invalidate, userId]);

  const grant = useCallback(
    async (
      permissionCode: string,
      effect: OverrideEffect,
      reason: string,
      expiresAt?: string | null
    ) => {
      try {
        const body: SetOverridePayload = {
          user_id: userId,
          permission_code: permissionCode,
          effect,
          reason,
          expires_at: expiresAt || null,
        };
        await mutateAsync({ url: USER_OVERRIDE_ENDPOINT, body });
        toast.success(t.organizations.overrides.saved);
        await refresh();
        return true;
      } catch (error) {
        applyApiError(error);
        return false;
      }
    },
    [mutateAsync, userId, refresh]
  );

  const remove = useCallback(
    async (permissionCode: string) => {
      try {
        // DELETE reuses the same shape as POST; `effect` is required by the
        // serializer but ignored by the removal itself.
        const body: SetOverridePayload = {
          user_id: userId,
          permission_code: permissionCode,
          effect: 'deny',
        };
        await mutateAsync({ url: USER_OVERRIDE_ENDPOINT, method: 'delete', body });
        toast.success(t.organizations.overrides.removed);
        await refresh();
        return true;
      } catch (error) {
        applyApiError(error);
        return false;
      }
    },
    [mutateAsync, userId, refresh]
  );

  return {
    overrides: overridesQuery.data?.data ?? [],
    isLoading: overridesQuery.isLoading,
    isSubmitting: isPending,
    grant,
    remove,
  };
}
