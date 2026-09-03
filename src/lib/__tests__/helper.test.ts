import { describe, it, expect } from 'vitest';
import { hasAccess, hasFunctionalPermission, can, getAxiosError } from '../helper';
import { AxiosError } from 'axios';

// Permissions are now passed to the helpers directly (they no longer live on the
// session). This just returns the code list so the existing call sites read naturally.
function makeSession(permissions: string[] = []): string[] {
  return permissions;
}

describe('hasFunctionalPermission', () => {
  it('returns true when user has exact permission', () => {
    const session = makeSession(['dashboard:view']);
    expect(hasFunctionalPermission(session, 'dashboard', 'read')).toBe(true);
  });

  it('returns true when user has write and read is requested (write implies read)', () => {
    const session = makeSession(['dashboard:manage']);
    expect(hasFunctionalPermission(session, 'dashboard', 'read')).toBe(true);
  });

  it('returns false when user lacks permission', () => {
    const session = makeSession([]);
    expect(hasFunctionalPermission(session, 'dashboard', 'read')).toBe(false);
  });

  it('returns false for null session', () => {
    expect(hasFunctionalPermission(null, 'dashboard', 'read')).toBe(false);
  });
});

describe('hasAccess', () => {
  it('returns false for unmapped routes when user has no permissions', () => {
    // Fail closed: an unmapped route is not auto-allowed.
    expect(hasAccess(makeSession([]), '/some-unmapped-route')).toBe(false);
  });

  it('returns false for null session on any route', () => {
    expect(hasAccess(null, '/projects')).toBe(false);
  });

  // These assert on `/organization/members` rather than the demo module's route
  // so the suite still passes after `npm run strip-demo`.
  it('opens a route when the user holds the mapped resource at read level', () => {
    expect(hasAccess(makeSession(['member:view']), '/organization/members')).toBe(true);
  });

  it('does not let one resource unlock another route', () => {
    expect(hasAccess(makeSession(['user:view']), '/organization/members')).toBe(false);
  });

  it('denies a mapped route to a user holding nothing', () => {
    expect(hasAccess(makeSession([]), '/organization/members')).toBe(false);
  });

  it('covers detail routes through the parent prefix', () => {
    expect(hasAccess(makeSession(['member:view']), '/organization/members/some-id')).toBe(true);
  });

  it('returns true for a write-required check when the user has manage', () => {
    expect(hasAccess(makeSession(['member:manage']), '/organization/members', 'write')).toBe(true);
  });

  it('returns false for a write-required check when the user only has view', () => {
    expect(hasAccess(makeSession(['member:view']), '/organization/members', 'write')).toBe(false);
  });
});

describe('can (action-aware, for button/control gating)', () => {
  it('matches an exact resource:action code', () => {
    const session = makeSession(['project:create']);
    expect(can(session, 'project', 'create')).toBe(true);
    expect(can(session, 'project', 'update')).toBe(false);
  });

  it('treats manage as write — subsumes view/create/update', () => {
    const session = makeSession(['project:manage']);
    expect(can(session, 'project', 'view')).toBe(true);
    expect(can(session, 'project', 'create')).toBe(true);
    expect(can(session, 'project', 'update')).toBe(true);
  });

  it('does not let manage imply delete', () => {
    // The backend's `has()` is a literal subset check over `effective_codes()`,
    // which is never expanded from `manage` — an Admin with `organization:manage`
    // resolves `organization:delete` to false. While this was implied here, the
    // Organization Settings danger zone rendered for Admins against an API that
    // always refused it. Roles that may delete hold the explicit `:delete` code.
    const session = makeSession(['project:manage']);
    expect(can(session, 'project', 'delete')).toBe(false);
    expect(can(makeSession(['project:manage', 'project:delete']), 'project', 'delete')).toBe(true);
  });

  it('does not let manage imply the independent execute/export capabilities', () => {
    const session = makeSession(['project:manage']);
    expect(can(session, 'project', 'execute')).toBe(false);
    expect(can(session, 'project', 'export')).toBe(false);
  });

  it('returns false for null session', () => {
    expect(can(null, 'project', 'create')).toBe(false);
  });
});

describe('getAxiosError', () => {
  it('extracts detail from axios error response', () => {
    const err = new AxiosError('Request failed');
    err.response = { data: { detail: 'Not found' }, status: 404 } as never;
    expect(getAxiosError(err)).toBe('Not found');
  });

  it('returns message for plain Error', () => {
    expect(getAxiosError(new Error('oops'))).toBe('oops');
  });

  it('returns fallback for unknown error', () => {
    expect(getAxiosError('unexpected')).toBe('An unexpected error occurred.');
  });
});
