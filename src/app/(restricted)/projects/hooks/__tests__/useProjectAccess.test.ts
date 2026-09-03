import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { useProjectAccess } from '../useProjectAccess';

const membersRefetch = vi.fn();
const accessRefetch = vi.fn();
const mutateAsync = vi.fn();

let membersData:
  | {
      data: {
        user_id: string;
        full_name: string;
        email: string;
        role: { id: string; name: string; slug: string } | null;
      }[];
    }
  | undefined;
let accessData:
  | {
      data: {
        user_id: string;
        user_name: string;
        user_email: string;
        access_level: string;
        granted_by: string;
        granted_at: string;
      }[];
    }
  | undefined;
let membersLoading = false;
let accessLoading = false;
let membersError = false;
let accessError = false;

vi.mock('@/app/(restricted)/context/OrganizationContext', () => ({
  useOrganization: () => ({ organization: { id: 'org-1' } }),
}));

vi.mock('@/hooks/useAuthQuery', () => ({
  useAuthQuery: (key: unknown[]) => {
    const isAccessQuery = Array.isArray(key) && key[0] === 'project-access';
    if (isAccessQuery) {
      return {
        data: accessData,
        isLoading: accessLoading,
        isError: accessError,
        refetch: accessRefetch,
      };
    }
    return {
      data: membersData,
      isLoading: membersLoading,
      isError: membersError,
      refetch: membersRefetch,
    };
  },
}));

vi.mock('@/hooks/useAuthMutation', () => ({
  useAuthMutation: () => ({ mutateAsync }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('useProjectAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    membersLoading = false;
    accessLoading = false;
    membersError = false;
    accessError = false;
    membersData = {
      data: [
        {
          user_id: 'u1',
          full_name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: { id: 'r1', name: 'Member', slug: 'member' },
        },
        {
          user_id: 'u2',
          full_name: 'Grace Hopper',
          email: 'grace@example.com',
          role: { id: 'r1', name: 'Member', slug: 'member' },
        },
      ],
    };
    accessData = {
      data: [
        {
          user_id: 'u1',
          user_name: 'Ada Lovelace',
          user_email: 'ada@example.com',
          access_level: 'editor',
          granted_by: 'owner@example.com',
          granted_at: '2026-01-01T00:00:00Z',
        },
      ],
    };
  });

  it('left-joins the org roster with the project grants, defaulting to no access', () => {
    const { result } = renderHook(() => useProjectAccess('project-1'));

    expect(result.current.rows).toEqual([
      {
        user_id: 'u1',
        full_name: 'Ada Lovelace',
        email: 'ada@example.com',
        access_level: 'editor',
        granted_by: 'owner@example.com',
        granted_at: '2026-01-01T00:00:00Z',
        role_name: 'Member',
        has_org_wide_access: false,
      },
      {
        user_id: 'u2',
        full_name: 'Grace Hopper',
        email: 'grace@example.com',
        access_level: 'none',
        granted_by: null,
        granted_at: null,
        role_name: 'Member',
        has_org_wide_access: false,
      },
    ]);
  });

  // Only the org Owner bypasses ProjectAccess scoping — Admin is scoped to its
  // grants like any other role, so it is NOT flagged as org-wide. Mirrors
  // PROJECT_SCOPE_BYPASS_ROLE_SLUGS in apps/projects/constants.py.
  it('flags only Owner-role members as having org-wide access', () => {
    membersData = {
      data: [
        {
          user_id: 'u3',
          full_name: 'Admin Person',
          email: 'admin@example.com',
          role: { id: 'r2', name: 'Admin', slug: 'admin' },
        },
        {
          user_id: 'u4',
          full_name: 'Owner Person',
          email: 'owner@example.com',
          role: { id: 'r3', name: 'Owner', slug: 'owner' },
        },
        {
          user_id: 'u5',
          full_name: 'Read Only Person',
          email: 'ro@example.com',
          role: { id: 'r4', name: 'Read Only', slug: 'read-only' },
        },
      ],
    };
    accessData = { data: [] };

    const { result } = renderHook(() => useProjectAccess('project-1'));

    // admin -> false (scoped to grants), owner -> true, read-only -> false
    expect(result.current.rows.map((row) => row.has_org_wide_access)).toEqual([false, true, false]);
  });

  it('grants access with a POST and refetches on success', async () => {
    mutateAsync.mockResolvedValueOnce({});
    const { result } = renderHook(() => useProjectAccess('project-1'));

    await result.current.grantAccess('u2', 'viewer');

    expect(mutateAsync).toHaveBeenCalledWith({
      url: '/api/v1/projects/project-1/access/',
      method: 'post',
      body: { user_id: 'u2', access_level: 'viewer' },
    });
    expect(toast.success).toHaveBeenCalled();
    expect(accessRefetch).toHaveBeenCalled();
  });

  it('revokes access with a DELETE and refetches on success', async () => {
    mutateAsync.mockResolvedValueOnce({});
    const { result } = renderHook(() => useProjectAccess('project-1'));

    await result.current.revokeAccess('u1');

    expect(mutateAsync).toHaveBeenCalledWith({
      url: '/api/v1/projects/project-1/access/u1/',
      method: 'delete',
    });
    expect(accessRefetch).toHaveBeenCalled();
  });

  it('changeAccess routes "none" to revoke and any level to a PATCH', async () => {
    mutateAsync.mockResolvedValue({});
    const { result } = renderHook(() => useProjectAccess('project-1'));

    await result.current.changeAccess('u1', 'none');
    expect(mutateAsync).toHaveBeenLastCalledWith({
      url: '/api/v1/projects/project-1/access/u1/',
      method: 'delete',
    });

    // PATCH, not POST: the grant endpoint refuses to upsert, so changing an
    // existing row's level via POST fails with "already has access".
    await result.current.changeAccess('u2', 'manager');
    expect(mutateAsync).toHaveBeenLastCalledWith({
      url: '/api/v1/projects/project-1/access/u2/',
      method: 'patch',
      body: { access_level: 'manager' },
    });
  });

  it('clears pendingUserId after a failed mutation without throwing', async () => {
    mutateAsync.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useProjectAccess('project-1'));

    await result.current.grantAccess('u2', 'viewer');

    await waitFor(() => expect(result.current.pendingUserId).toBeNull());
  });

  it('reports loading/error as the union of both underlying queries', () => {
    accessError = true;
    const { result } = renderHook(() => useProjectAccess('project-1'));
    expect(result.current.isError).toBe(true);
  });
});
