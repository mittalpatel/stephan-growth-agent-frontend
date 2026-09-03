import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { getMyPermissions } from '@/lib/auth/getMyPermissions';
import { getMyOrganizations } from '@/lib/auth/getMyOrganizations';
import { getServerAccessToken } from '@/lib/auth/getServerAccessToken';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import UserContextProvider from './context/UserContext';
import PermissionsProvider from './context/PermissionsContext';
import OrganizationProvider from './context/OrganizationContext';
import PermissionGuard from './components/PermissionGuard';
import ErrorContextProvider from './components/ErrorContext';
import ImpersonationBanner from './components/ImpersonationBanner';

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
