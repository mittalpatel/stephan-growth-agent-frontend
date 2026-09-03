/**
 * Route-level authorization.
 *
 * This is the frontend mirror of the backend's per-view `required_permissions`
 * (each app's `api/v1/views/` + `apps/rbac/permissions.py`). A route prefix maps
 * to the resource(s) that unlock it; `src/lib/helper.ts` composes the actual
 * `{resource}:{action}` code and checks it against the user's permission set.
 *
 * **This map is a UX affordance, not a security boundary.** It decides what to
 * render and where to redirect. The backend independently refuses every request
 * the user is not entitled to, and it is the only thing standing between a
 * determined client and your data. A route missing from this map is a bad
 * experience; a view missing its permission declaration is a vulnerability.
 *
 * Longest matching prefix wins, so a child route can require a narrower
 * permission than its parent. Order in this array is irrelevant.
 */
export type PermissionLevel = 'read' | 'write';

export interface RoutePermission {
  prefix: string;
  /** The route opens if the user holds ANY of these at `level`. */
  resources: string[];
  /**
   * Minimum level to open the page; defaults to `'read'`. Per-action gating
   * *inside* a page (hiding a delete button) is done at the component level with
   * `PermissionGuard` / `can()`, not here.
   */
  level?: PermissionLevel;
}

export const ROUTE_PERMISSIONS: readonly RoutePermission[] = [
  // Resolved by longest matching prefix, so the two children must precede the
  // parent — otherwise /organization/members would be gated on `organization`
  // rather than on `member`, and a member-manager without organization:view
  // would be locked out of the screen they are meant to run.
  { prefix: '/organization/members', resources: ['member'] },
  { prefix: '/organization/roles', resources: ['rbac'] },
  { prefix: '/organization/audit', resources: ['audit'] },
  { prefix: '/organization/api-keys', resources: ['apikey'] },
  { prefix: '/organization', resources: ['organization'] },
  // Demo module — removed by `npm run strip-demo`.
  { prefix: '/projects', resources: ['project'] },
  // NOTE: `/admin/*` is deliberately absent. It is gated on `is_superuser`, not
  // on a permission code, so it is listed in PermissionGuard's SUPERUSER_PATHS
  // instead — a resource entry here would be an org-level permission granting a
  // platform-level capability.
];

/**
 * Role slugs whose holders see every project in their organization outright,
 * regardless of any per-project `ProjectAccess` grant.
 *
 * Mirrors `PROJECT_SCOPE_BYPASS_ROLE_SLUGS` in
 * `apps/projects/constants.py` — keep the two in sync. This is presentational
 * only: it lets the share dialog tell the truth about whose access it can and
 * cannot control. Granting or revoking a grant for one of these users is a
 * no-op, because `ProjectSelector` bypasses grant scoping for them entirely,
 * so the dialog pins them as non-removable rather than offering a revoke that
 * would silently change nothing.
 */
export const PROJECT_SCOPE_BYPASS_ROLE_SLUGS: readonly string[] = ['owner'];
