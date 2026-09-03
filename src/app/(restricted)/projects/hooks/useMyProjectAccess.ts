'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { projectAccessMineEndpoint, projectAccessMineKey } from '@/services/projects';

type MyAccessLevel = 'owner' | 'org_wide' | 'viewer' | 'editor' | 'manager' | null;

/**
 * The caller's own standing on one project, via the `project:view`-gated
 * `.../access/mine/` endpoint — deliberately not `useProjectAccess`, whose
 * roster query requires `project:access_manage` and 403s for a Member, even
 * one holding an editor grant on this exact project. See the endpoint's
 * backend docstring for why the split exists.
 */
export function useMyProjectAccess(projectId: string) {
  const query = useAuthQuery<{ data: { access_level: MyAccessLevel } }>(
    projectAccessMineKey(projectId),
    projectAccessMineEndpoint(projectId),
    { enabled: Boolean(projectId) }
  );

  const accessLevel = query.data?.data.access_level ?? null;

  return {
    accessLevel,
    isOwner: accessLevel === 'owner',
    hasEditorGrant:
      accessLevel === 'owner' ||
      accessLevel === 'org_wide' ||
      accessLevel === 'editor' ||
      accessLevel === 'manager',
    isLoading: query.isLoading,
  };
}
