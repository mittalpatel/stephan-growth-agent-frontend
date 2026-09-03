import 'next-auth';
import 'next-auth/jwt';

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
}

/**
 * The active support-impersonation session, or absent when there is none — which
 * is the case for essentially every session.
 *
 * Display only, like `organization` below. The authoritative grant is the `imp`
 * claim inside the JWT, and the backend re-reads the session row on every request
 * to re-check expiry, revocation, and write permission. Editing this object in the
 * browser hides the banner and changes nothing the backend will honour, which is
 * the right way round: the UI cannot grant access, only fail to warn about it.
 */
export interface ImpersonationSummary {
  id: string;
  impersonator_email: string;
  target_email: string;
  organization: OrganizationSummary | null;
  reason: string;
  write_enabled: boolean;
  started_at: string;
  expires_at: string;
  ended_at: string | null;
  is_live: boolean;
}

declare module 'next-auth' {
  interface Account {
    // Set (mutated in place) by authOptions.ts's `signIn` callback after a
    // successful social-login (OIDC) exchange with the backend — the only
    // channel from `signIn` to the `jwt` callback for that same sign-in.
    // Absent for the credentials provider and for any social login that
    // resulted in an `mfa_required` redirect instead of a real session.
    backendAccess?: string;
    backendRefresh?: string;
    backendUser?: unknown;
  }

  interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    access: string;
    refresh: string;
    backendRefreshToken?: string;
    registration_type: 'local' | 'external';
    // Gates the platform-admin surface in the nav. Not an authorization decision:
    // every impersonation endpoint re-checks is_superuser server-side, so a
    // browser that sets this to true gets a visible menu item and 403s behind it.
    is_superuser: boolean;
    role: {
      id: string;
      name: string;
      slug: string;
    } | null;
    // The organization this session acts in, plus every organization the user may
    // switch to. Present in BOTH tenancy modes — a single-tenant deployment carries
    // exactly one entry and the UI hides the switcher, which is what keeps the two
    // modes on one code path instead of two.
    //
    // Display only. The authoritative active organization is the signed `org_id`
    // claim inside the JWT, which the backend re-checks against live membership on
    // every request; editing this object in the browser changes what renders and
    // nothing the backend will honour.
    organization: OrganizationSummary | null;
    organizations: OrganizationSummary[];
    // NOTE: permissions are intentionally NOT on the session/JWT anymore. They're
    // fetched via GET /api/v1/auth/me/permissions/ and held in the client
    // PermissionsProvider (app/(restricted)/context/PermissionsContext.tsx) — keeping
    // them here bloated the cookie past the browser limit (forcing NextAuth chunking)
    // and let grants go stale until the next login.
    image?: string | null;
    profile_image?: string | null;
  }

  interface Session {
    // Deliberately omit access/refresh/backendRefreshToken, including the access
    // token itself: this object is exactly what GET /api/auth/session and every
    // client-side useSession()/getSession() call return, to any script running on
    // the page. Both credentials live solely in the encrypted JWT cookie; the
    // browser never calls the backend directly (see src/client/axiosAuth.ts,
    // which now routes through the same-origin /api/backend/* proxy instead of
    // attaching a bearer token itself), and server-only code that needs the raw
    // access token reads it via lib/auth/getServerAccessToken.ts, never from here.
    user: Omit<User, 'access' | 'refresh' | 'backendRefreshToken'>;
    // Safe to expose where the tokens are not: it names who is acting as whom and
    // until when, which is information the banner must show and which grants
    // nothing on its own.
    impersonation?: ImpersonationSummary | null;
    expires: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    user?: import('next-auth').User;
    backendRefreshToken?: string;
    // The active impersonation session, mirrored from the backend for the banner.
    impersonation?: ImpersonationSummary | null;
    // The admin's OWN token pair, parked here while they impersonate someone.
    //
    // Without this, ending a session logs the admin out — they would have to sign
    // in again every time, which trains people to just close the tab instead and
    // leave the grant open until it expires. The control that ends sessions
    // promptly has to be the cheapest thing on the screen.
    priorSession?: {
      accessToken: string;
      backendRefreshToken: string;
      user: import('next-auth').User;
    } | null;
  }
}
