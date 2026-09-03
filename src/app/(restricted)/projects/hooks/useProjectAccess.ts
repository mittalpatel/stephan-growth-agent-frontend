'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { PROJECT_SCOPE_BYPASS_ROLE_SLUGS } from '@/constants/roles';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { t } from '@/locales';
import { organizationMembersEndpoint, organizationMembersKey } from '@/services/organizations';
import {
  projectAccessEndpoint,
  projectAccessKey,
  projectAccessRevokeEndpoint,
} from '@/services/projects';
import type { ProjectAccessGrant, ProjectAccessLevel } from '@/types/project';

/**
 * The org's roster. The RBAC role is carried through (not dropped) because
 * Owner/Admin-role members bypass `ProjectAccess` scoping entirely — the share
 * dialog needs to know that to avoid offering a revoke that does nothing. See
 * `PROJECT_SCOPE_BYPASS_ROLE_SLUGS`.
 */
type OrgMember = {
  user_id: string;
  full_name: string;
  email: string;
  role: { id: string; name: string; slug: string } | null;
};

/** No-access sentinel for the row select — never sent to the backend as a value. */
export type AccessLevelOrNone = ProjectAccessLevel | 'none';

export interface ProjectAccessRow {
  user_id: string;
  full_name: string;
  email: string;
  access_level: AccessLevelOrNone;
  granted_by: string | null;
  granted_at: string | null;
  /** Display name of the member's org role, for the pinned org-wide rows. */
  role_name: string | null;
  /**
   * True when this member's org role (Owner/Admin) grants them every project
   * regardless of grants. Their access is not controllable from this dialog.
   */
  has_org_wide_access: boolean;
}

/**
 * Who has access to one project, and the ability to grant/revoke it.
 *
 * Mirrors `useOrganizationMembers`'s shape deliberately (`AGENTS.md`: a
 * component that calls `useMutation`, builds a request body, or maps API
 * errors inline is wrong) — a hand-rolled `useCallback` per action, backed by
 * `useAuthMutation`'s `mutateAsync`, with `applyApiError` + `toast` +
 * `.refetch()` rather than TanStack `useMutation` used directly in a component.
 *
 * The row list is the org's member roster left-joined with this project's
 * access grants: everyone in the organization appears, defaulted to `'none'`
 * unless a grant says otherwise. That is what lets the table offer "grant
 * access" to someone who has never had any, not just "change" to someone who
 * already does.
 */
export function useProjectAccess(projectId: string) {
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? '';
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const membersQuery = useAuthQuery<{ data: OrgMember[] }>(
    organizationMembersKey(organizationId),
    organizationMembersEndpoint(organizationId),
    { enabled: Boolean(organizationId) }
  );

  const accessQuery = useAuthQuery<{ data: ProjectAccessGrant[] }>(
    projectAccessKey(projectId),
    projectAccessEndpoint(projectId),
    { enabled: Boolean(projectId) }
  );

  const { mutateAsync: mutate } = useAuthMutation();

  const grantAccess = useCallback(
    async (userId: string, accessLevel: ProjectAccessLevel) => {
      setPendingUserId(userId);
      try {
        await mutate({
          url: projectAccessEndpoint(projectId),
          method: 'post',
          body: { user_id: userId, access_level: accessLevel },
        });
        toast.success(t.projects.access.toast.granted);
        await accessQuery.refetch();
      } catch (error) {
        applyApiError(error);
      } finally {
        setPendingUserId(null);
      }
    },
    [mutate, projectId, accessQuery]
  );

  const revokeAccess = useCallback(
    async (userId: string) => {
      setPendingUserId(userId);
      try {
        await mutate({
          url: projectAccessRevokeEndpoint(projectId, userId),
          method: 'delete',
        });
        toast.success(t.projects.access.toast.revoked);
        await accessQuery.refetch();
      } catch (error) {
        applyApiError(error);
      } finally {
        setPendingUserId(null);
      }
    },
    [mutate, projectId, accessQuery]
  );

  /** Change the level of a grant that already exists (PATCH, not POST).
   *
   * The POST endpoint deliberately refuses to upsert — see
   * `ProjectAccessService.grant` — so re-POSTing for someone who already has
   * access fails with "already has access" rather than changing their level.
   * Rows in the "people with access" list are, by definition, already granted. */
  const updateAccessLevel = useCallback(
    async (userId: string, accessLevel: ProjectAccessLevel) => {
      setPendingUserId(userId);
      try {
        await mutate({
          url: projectAccessRevokeEndpoint(projectId, userId),
          method: 'patch',
          body: { access_level: accessLevel },
        });
        toast.success(t.projects.access.toast.granted);
        await accessQuery.refetch();
      } catch (error) {
        applyApiError(error);
      } finally {
        setPendingUserId(null);
      }
    },
    [mutate, projectId, accessQuery]
  );

  /** Called by the row select: `'none'` revokes, anything else updates the
   *  existing grant's level. Only ever called for rows that already hold a
   *  grant; adding someone new goes through `grantAccess` in `AddPeople`. */
  const changeAccess = useCallback(
    async (userId: string, level: AccessLevelOrNone) => {
      if (level === 'none') {
        await revokeAccess(userId);
      } else {
        await updateAccessLevel(userId, level);
      }
    },
    [updateAccessLevel, revokeAccess]
  );

  const members = useMemo(() => membersQuery.data?.data ?? [], [membersQuery.data]);
  const grants = useMemo(() => accessQuery.data?.data ?? [], [accessQuery.data]);

  const rows = useMemo<ProjectAccessRow[]>(() => {
    const grantByUserId = new Map(grants.map((grant) => [grant.user_id, grant]));
    return members.map((member) => {
      const grant = grantByUserId.get(member.user_id);
      const slug = member.role?.slug ?? null;
      return {
        user_id: member.user_id,
        full_name: member.full_name,
        email: member.email,
        access_level: grant?.access_level ?? 'none',
        granted_by: grant?.granted_by ?? null,
        granted_at: grant?.granted_at ?? null,
        role_name: member.role?.name ?? null,
        has_org_wide_access: slug !== null && PROJECT_SCOPE_BYPASS_ROLE_SLUGS.includes(slug),
      };
    });
  }, [members, grants]);

  return {
    rows,
    isLoading: membersQuery.isLoading || accessQuery.isLoading,
    isError: membersQuery.isError || accessQuery.isError,
    pendingUserId,
    grantAccess,
    revokeAccess,
    updateAccessLevel,
    changeAccess,
    refetch: accessQuery.refetch,
  };
}
