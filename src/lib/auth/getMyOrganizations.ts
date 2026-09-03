import 'server-only';
import type { OrganizationSummary } from '@/types/next-auth';

// Server-side fetch of the caller's *current* organization memberships.
//
// `session.user.organizations` (and `.organization`) are snapshotted into the JWT
// once, at login or at `switch/` — never re-derived afterward, the same staleness
// problem `getMyPermissions` exists to avoid for permissions (see its comment).
// Without this, a member removed from an organization by someone else keeps
// seeing that organization in their own switcher until they next log out and
// back in: the session token itself never learns the membership is gone.
//
// SECURITY: same reasoning as `getMyPermissions` — per-user data, `no-store` only.
export async function getMyOrganizations(accessToken: string | undefined): Promise<{
  data: OrganizationSummary[];
  /** False when the fetch failed — callers fall back to the session snapshot
   *  rather than blanking the switcher on a transient blip. */
  loaded: boolean;
}> {
  if (!accessToken) return { data: [], loaded: false };

  const base = process.env.NEXT_PUBLIC_BACKEND_API ?? '';
  try {
    const res = await fetch(`${base}api/v1/organizations/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return { data: [], loaded: false };

    const body = (await res.json()) as {
      data?: Array<{ id: string; name: string; slug: string }>;
    };
    return {
      data: (body.data ?? []).map(({ id, name, slug }) => ({ id, name, slug })),
      loaded: true,
    };
  } catch {
    return { data: [], loaded: false };
  }
}
