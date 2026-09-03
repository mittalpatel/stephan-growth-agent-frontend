'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { applyApiError } from '@/lib/apiError';
import {
  organizationInviteEndpoint,
  organizationInviteResendEndpoint,
  organizationInvitesEndpoint,
  organizationInvitesKey,
  organizationMemberEndpoint,
  organizationMembersEndpoint,
  organizationMembersKey,
  organizationRolesEndpoint,
  organizationRolesKey,
  type PendingInvite,
} from '@/services/organizations';
import { t } from '@/locales';

export interface OrganizationMember {
  user_id: string;
  email: string;
  full_name: string;
  role: { id: string; name: string; slug: string } | null;
  joined_at: string;
}

export interface AssignableRole {
  id: string;
  name: string;
  slug: string;
  is_system: boolean;
  permissions: string[];
}

/**
 * All state for the members screen, returned as a flat props bag.
 *
 * The component that consumes this is a pure presenter — it never builds a request
 * body or maps an API error itself (`AGENTS.md`: "a component that calls
 * useMutation, builds a request body, or maps API errors inline is wrong").
 */
export function useOrganizationMembers() {
  const { organization } = useOrganization();
  const { permissions: heldCodes } = usePermissions();
  const organizationId = organization?.id ?? '';
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const membersQuery = useAuthQuery<{ data: OrganizationMember[] }>(
    organizationMembersKey(organizationId),
    organizationMembersEndpoint(organizationId),
    { enabled: Boolean(organizationId) }
  );

  const rolesQuery = useAuthQuery<{ data: AssignableRole[] }>(
    organizationRolesKey(organizationId),
    organizationRolesEndpoint(organizationId),
    { enabled: Boolean(organizationId) }
  );

  const invitesQuery = useAuthQuery<{ data: PendingInvite[] }>(
    organizationInvitesKey(organizationId),
    organizationInvitesEndpoint(organizationId),
    { enabled: Boolean(organizationId) }
  );

  const { mutateAsync: mutate } = useAuthMutation();
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);

  const revokeInvite = useCallback(
    async (inviteId: string) => {
      setPendingInviteId(inviteId);
      try {
        await mutate({
          url: organizationInviteEndpoint(organizationId, inviteId),
          method: 'delete',
        });
        toast.success(t.organizations.members.inviteRevoked);
        await invitesQuery.refetch();
      } catch (error) {
        applyApiError(error);
      } finally {
        setPendingInviteId(null);
      }
    },
    [mutate, organizationId, invitesQuery]
  );

  const resendInvite = useCallback(
    async (inviteId: string) => {
      setPendingInviteId(inviteId);
      try {
        await mutate({
          url: organizationInviteResendEndpoint(organizationId, inviteId),
          method: 'post',
          body: { domain: window.location.origin },
        });
        toast.success(t.organizations.members.inviteResent);
        await invitesQuery.refetch();
      } catch (error) {
        applyApiError(error);
      } finally {
        setPendingInviteId(null);
      }
    },
    [mutate, organizationId, invitesQuery]
  );

  const changeRole = useCallback(
    async (userId: string, roleId: string) => {
      setPendingUserId(userId);
      try {
        await mutate({
          url: organizationMemberEndpoint(organizationId, userId),
          method: 'patch',
          body: { role_id: roleId },
        });
        toast.success(t.organizations.members.roleChanged);
        await membersQuery.refetch();
      } catch (error) {
        applyApiError(error);
      } finally {
        setPendingUserId(null);
      }
    },
    [mutate, organizationId, membersQuery]
  );

  const removeMember = useCallback(
    async (userId: string) => {
      setPendingUserId(userId);
      try {
        await mutate({
          url: organizationMemberEndpoint(organizationId, userId),
          method: 'delete',
        });
        toast.success(t.organizations.members.removed);
        await membersQuery.refetch();
      } catch (error) {
        applyApiError(error);
      } finally {
        setPendingUserId(null);
      }
    },
    [mutate, organizationId, membersQuery]
  );

  const members = useMemo(() => membersQuery.data?.data ?? [], [membersQuery.data]);
  const roles = useMemo(() => rolesQuery.data?.data ?? [], [rolesQuery.data]);
  // Mirrors the backend's assert_within_ceiling: hide a role from the picker if
  // it carries a permission the actor does not hold themselves (e.g. an Admin
  // cannot see "Owner"), so the UI never offers a choice the server will reject.
  const assignableRoles = useMemo(
    () => roles.filter((role) => role.permissions.every((code) => heldCodes.includes(code))),
    [roles, heldCodes]
  );
  const pendingInvites = useMemo(() => invitesQuery.data?.data ?? [], [invitesQuery.data]);

  const refetchAll = useCallback(async () => {
    await Promise.all([membersQuery.refetch(), invitesQuery.refetch()]);
  }, [membersQuery, invitesQuery]);

  return {
    organization,
    members,
    roles: assignableRoles,
    pendingInvites,
    isLoading: membersQuery.isLoading,
    isError: membersQuery.isError,
    isInvitesLoading: invitesQuery.isLoading,
    pendingUserId,
    pendingInviteId,
    changeRole,
    removeMember,
    revokeInvite,
    resendInvite,
    refetch: membersQuery.refetch,
    refetchAll,
  };
}
