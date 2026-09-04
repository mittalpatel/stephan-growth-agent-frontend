'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePermissions } from '../context/PermissionsContext';
import { useOptionalUser } from '../context/UserContext';

// Per-route permission enforcement for the restricted area. The middleware only does
// coarse edge checks (authenticated? route enabled?) because permissions no longer
// live in the JWT; the fine-grained check runs here instead. It works on client-side
// navigations too — where the server layout does NOT re-run — using the permissions
// already seeded from the server, so there's no fetch/flicker. The backend remains
// the real authorization gate; this is UX-level protection.
//
// Paths every authenticated user may reach regardless of permissions.
// `/organization/new` included deliberately: a permission-less, organization-less
// user has no role to be gated by yet, and creating their first organization is
// how they get one — it cannot itself require a permission to reach. `/invites`
// is the other way in for the same user: accepting a pending invite is how an
// existing, org-less account gets its first membership (and so its first
// permission), which by definition can't itself be permission-gated.
// `/notifications` included for the same reason `/user-profile` is: a
// notification belongs to its recipient, not to a role, and the backend
// enforces that with no `required_permissions` at all (see
// apps/notifications/api/v1/views's module docstring) — there is no
// permission for this map to gate on.
//
// `/dashboard` belongs here for a different reason, and its absence was a real
// bug: `hasAccess()` returns `false` for any route with no `ROUTE_PERMISSIONS`
// entry (see its own test — an unmapped route is deliberately "blocked", not
// "open"), and `/dashboard` has never had one, since `navItems.ts`'s doc
// comment says it must be reachable by every authenticated user regardless of
// role. The two decisions contradicted each other: any user who held at least
// one other permission was bounced off `/dashboard` on every visit, straight
// to `defaultRoute()` (whichever `ROUTE_PERMISSIONS` entry they could open),
// before ever seeing it render. Caught while logged in as an end-to-end demo
// user, not from a permission-less test account, which is exactly the case
// this array's existing entries don't cover.
//
// `/conversations`, `/leads`, `/analytics` remain here for the same reason
// `navItems.ts` gives their nav entries no `requiredFunction` yet: they're
// Sprint 1 static previews, and the `conversation`/`lead` permission codes
// aren't wired into `ROUTE_PERMISSIONS` until their own phase lands. `/agents`
// moved out once the backend's `agent` permission code landed and got its own
// `ROUTE_PERMISSIONS` entry.
const GLOBAL_PATHS = [
  '/no-role',
  '/user-profile',
  '/organization/new',
  '/invites',
  '/notifications',
  '/dashboard',
  '/conversations',
  '/leads',
  '/analytics',
];

// Platform-admin paths: open to superusers, closed to everyone else, and gated on
// the account flag rather than a permission code. They are deliberately absent
// from ROUTE_PERMISSIONS — a resource entry there would be an organization-level
// permission granting a platform-level capability, which an Owner could then put
// on a custom role. The page itself also redirects server-side, and every endpoint
// behind it re-checks; this only decides what renders on a client navigation.
const SUPERUSER_PATHS = ['/admin'];

function matches(paths: readonly string[], pathname: string): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isGlobal(pathname: string): boolean {
  return matches(GLOBAL_PATHS, pathname);
}

export default function PermissionGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const { loaded, hasRouteAccess, defaultRoute } = usePermissions();
  // Optional: no provider reads as "not a superuser", which fails closed.
  const user = useOptionalUser();
  const pathname = usePathname();
  const router = useRouter();

  const superuserPath = matches(SUPERUSER_PATHS, pathname);
  // A superuser on /admin/* is allowed through without consulting permissions at
  // all; anyone else on the same path is blocked, whatever their permissions say.
  const global = isGlobal(pathname) || (superuserPath && Boolean(user?.session.user?.is_superuser));

  // Fail CLOSED, consistently with the sidebar: once permissions are resolved, a route
  // the user can't access is blocked. We only enforce after `loaded` so we don't act
  // on a half-known set — but `loaded` becomes true even when the fetch fails with no
  // server seed (see PermissionsContext), so an unreachable backend redirects to
  // /no-role rather than rendering pages we could never authorize. The backend is
  // still the real gate; this keeps the UI honest.
  const blocked = superuserPath ? !global : loaded && !global && !hasRouteAccess(pathname, 'read');

  // `defaultRoute()` returns /no-role when the user has no permissions, otherwise the
  // first route they can actually reach — so an unauthorized page bounces somewhere
  // valid and never loops (it only ever targets a route the user passes).
  const destination = blocked ? defaultRoute() : null;

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  // Until permissions resolve on a protected route, render nothing rather than flash a
  // page the user may not be allowed to see. Global paths (/no-role, /user-profile)
  // are always allowed and never wait.
  if (!global && !loaded) return null;
  if (blocked) return null;
  return <>{children}</>;
}
