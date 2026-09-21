import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { getMyPermissions } from '@/lib/auth/getMyPermissions';
import { getMyOrganizations } from '@/lib/auth/getMyOrganizations';
import { getServerAccessToken } from '@/lib/auth/getServerAccessToken';
import { getOrgBrandSummary } from '@/lib/auth/getOrgBrandSummary';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import UserContextProvider from './context/UserContext';
import PermissionsProvider from './context/PermissionsContext';
import OrganizationProvider from './context/OrganizationContext';
import PermissionGuard from './components/PermissionGuard';
import ErrorContextProvider from './components/ErrorContext';
import ImpersonationBanner from './components/ImpersonationBanner';

/**
 * Tab title and icon carry the organization's white-label identity instead of the
 * platform's. Overrides the root layout's `%s | YB Inspire` template for every page
 * below this layout. Resolved per request, so a rename shows on the next navigation.
 *
 * `icons` is set here rather than left to `LayoutWrapper`'s effect alone: an explicit
 * `icons` replaces the file-based `src/app/favicon.ico` Next would otherwise emit,
 * where appending a second `<link rel="icon">` client-side only leaves the browser to
 * choose between them (Chrome keeps the `.ico`, which declares `sizes="256x256"`
 * against an unsized PNG). Set server-side there is exactly one icon, in the first
 * HTML, so the tab never shows the platform icon first.
 */
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getOrgBrandSummary(await getServerAccessToken());
  const name = brand?.display_name.trim();
  const favicon = brand?.favicon_url.trim();
  return {
    ...(name ? { title: { default: name, template: `%s | ${name}` } } : {}),
    ...(favicon ? { icons: { icon: favicon } } : {}),
  };
}

export default async function RestrictedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  // Permissions are fetched here (server-side, no-store) rather than carried in the
  // session JWT, then seeded into the client PermissionsProvider so the UI has them
  // at first paint. PermissionGuard enforces per-route access on client navigations.
  // The access token comes from the raw JWT cookie, not session.accessToken — that
  // field no longer exists (see types/next-auth.d.ts).
  const accessToken = await getServerAccessToken();
  const { data: perms, loaded } = await getMyPermissions(accessToken);

  // Same staleness problem as permissions, for the organization switcher: the
  // session's `organizations` array is a snapshot taken at login/switch, not a
  // live read. Refetching here means a member removed from an organization by
  // someone else stops seeing it in their own switcher on their very next
  // navigation, rather than only after they log out and back in.
  const { data: liveOrganizations, loaded: organizationsLoaded } =
    await getMyOrganizations(accessToken);
  const organizations = organizationsLoaded
    ? liveOrganizations
    : (session.user.organizations ?? []);
  const organization = organizationsLoaded
    ? (organizations.find((org) => org.id === session.user.organization?.id) ?? null)
    : (session.user.organization ?? null);

  return (
    <UserContextProvider session={session}>
      <OrganizationProvider organization={organization} organizations={organizations}>
        <PermissionsProvider permissions={perms.permissions} role={perms.role} loaded={loaded}>
          <ErrorContextProvider>
            <PermissionGuard>
              {/* Outside LayoutWrapper on purpose: the banner must not scroll
                  away, sit inside a collapsible sidebar, or be reachable by any
                  page's own layout. It is the one element that has to be
                  visible whatever the page does. */}
              {session.impersonation ? (
                <ImpersonationBanner session={session.impersonation} />
              ) : null}
              <LayoutWrapper>{children}</LayoutWrapper>
            </PermissionGuard>
          </ErrorContextProvider>
        </PermissionsProvider>
      </OrganizationProvider>
    </UserContextProvider>
  );
}
