import { AxiosError } from 'axios';

import { DEFAULT_LANDING } from '@/constants/navItems';
import { ROUTE_PERMISSIONS } from '@/constants/roles';
import type { PermissionLevel, RoutePermission } from '@/constants/roles';

export const NO_ROLE_ROUTE = '/no-role';

/**
 * Permission codes are `{resource}:{action}` — e.g. `project:view`.
 *
 * This module is the frontend half of `common/constants/permissions.py`, and
 * `src/__tests__/contracts.test.ts` asserts the two agree. The separator and the
 * subsumption rules below are not local conventions; changing either here
 * without changing the backend produces a UI that disagrees with the API about
 * who can do what.
 */
function normalizePermission(entry: unknown): string {
  return typeof entry === 'string' ? entry : '';
}

function stripTrailingSlash(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

// The full set of actions the backend can gate on (common/constants/permissions.py).
// Gate individual controls (e.g. an Add/Edit/Delete button) on the specific action
// they perform via `can()` — don't collapse everything onto read/write.
export type PermissionAction =
  | 'view'
  | 'manage'
  | 'create'
  | 'update'
  | 'delete'
  | 'execute'
  | 'export'
  | 'billing'
  | 'transfer'
  | 'access_manage';

// `manage` is full write access, so it subsumes view and the create/update pair —
// but NOT delete/execute/export/billing/transfer/access_manage, which the backend
// grants independently. billing and transfer are what separate an organization's
// Owner from its Admin: if `manage` implied them, every admin would silently be an
// owner. `access_manage` is similarly independent — being able to edit a project's
// fields does not imply being trusted to grant or revoke other people's access to it.
//
// `delete` is excluded for the same reason, learned the hard way: the backend's
// resolver does *not* subsume it (verified — an Admin holding `organization:manage`
// resolves `organization:delete` to false), it seeds the specific code to the roles
// that should have it. While `delete` was implied here, an Admin was shown the
// Organization Settings danger zone — a "delete this organization" control that
// could only ever 403. Roles that may genuinely delete (Owner for the org,
// Owner/Admin for projects) hold the explicit `:delete` code and are unaffected.
const MANAGE_IMPLIED: ReadonlySet<PermissionAction> = new Set<PermissionAction>([
  'view',
  'create',
  'update',
]);

// Core primitive: does this permission list grant `{resource}:{action}`?
// Honours the backend's MANAGE-subsumes semantics above.
function holdsPermission(
  permissions: readonly unknown[],
  resource: string,
  action: PermissionAction
): boolean {
  const target = `${resource}:${action}`;
  return permissions.some((raw) => {
    const code = normalizePermission(raw);
    if (code === target) return true;
    return code === `${resource}:manage` && MANAGE_IMPLIED.has(action);
  });
}

// Public, action-aware check — use this for button/control-level gating, e.g.
// `can(permissions, 'project', 'create')`. In client code prefer the bound
// `usePermissions().can('project', 'create')`. Prefer it over the coarse
// read/write helpers when a control maps to a specific action.
export function can(
  permissions: readonly unknown[] | null | undefined,
  resource: string,
  action: PermissionAction
): boolean {
  if (!permissions) return false;
  return holdsPermission(permissions, resource, action);
}

function actionForLevel(level: PermissionLevel): PermissionAction {
  return level === 'write' ? 'manage' : 'view';
}

// Resolve a pathname to the route rule that guards it via longest-prefix match —
// the frontend mirror of the backend resolving a request to the view that owns it.
function routeRuleFor(route: string): RoutePermission | null {
  const path = stripTrailingSlash(route);
  let best: RoutePermission | null = null;
  let bestLen = -1;
  for (const rule of ROUTE_PERMISSIONS) {
    const prefix = stripTrailingSlash(rule.prefix);
    if ((path === prefix || path.startsWith(prefix + '/')) && prefix.length > bestLen) {
      best = rule;
      bestLen = prefix.length;
    }
  }
  return best;
}

function findRouteFromPermissions(permissions: readonly unknown[]): string | null {
  for (const rule of ROUTE_PERMISSIONS) {
    if (hasAccess(permissions, rule.prefix, rule.level ?? 'read')) return rule.prefix;
  }
  return null;
}

// Permissions are now fetched out-of-band (GET /api/v1/auth/me/permissions/) and
// held in the client PermissionsProvider / passed server-side — they no longer live
// on the session, so these helpers take the resolved code list directly.
/**
 * Where to send a user after login.
 *
 * A user with no permissions at all goes to `/no-role` rather than bouncing
 * between a landing page and a redirect. Otherwise the first route in
 * `ROUTE_PERMISSIONS` they can actually open wins, falling back to
 * `DEFAULT_LANDING` (which requires no permission).
 */
export function getDefaultRoute(
  permissions: readonly unknown[] | null | undefined,
  fallback = DEFAULT_LANDING
): string {
  const perms = permissions ?? [];
  if (!perms.length) return NO_ROLE_ROUTE;

  return findRouteFromPermissions(perms) ?? fallback;
}

export function hasAccess(
  permissions: readonly unknown[] | null | undefined,
  route: string,
  requiredLevel: PermissionLevel = 'read'
): boolean {
  const perms = permissions ?? [];
  const rule = routeRuleFor(route);
  if (!rule) return false;

  // A page may itself require write to open (rule.level); a caller asking for
  // write always needs write. Take the stronger of the two.
  const level: PermissionLevel =
    requiredLevel === 'write' || rule.level === 'write' ? 'write' : 'read';
  const action = actionForLevel(level);

  return rule.resources.some((resource) => holdsPermission(perms, resource, action));
}

export function hasFunctionalPermission(
  permissions: readonly unknown[] | null | undefined,
  functionName: string,
  level: PermissionLevel = 'read'
): boolean {
  if (!permissions) return false;
  return holdsPermission(permissions, functionName, actionForLevel(level));
}

export function getAxiosError(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (typeof data === 'string') return data;
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
    const firstKey = Object.keys(data ?? {})[0];
    if (firstKey) {
      const val = data[firstKey];
      return Array.isArray(val) ? val[0] : String(val);
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

// Backend surfaces a stable `errors.code` (e.g. "invite_expired") on every
// ApplicationError, independent of the locale-dependent `message` text — use
// this whenever the UI needs to branch on *which* failure happened rather
// than just display a message.
export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { errors?: { code?: string } } | undefined;
    return data?.errors?.code;
  }
  return undefined;
}
