import 'server-only';

// Server-side fetch of the caller's effective permission set + role. Permissions
// no longer ride in the session JWT (see lib/auth/authOptions.ts) — the restricted
// layout calls this on the server with the user's access token and seeds the client
// PermissionsProvider, so the UI has them at first paint without a client round-trip.
//
// SECURITY: this response is per-user and differentiated only by the Authorization
// header. We MUST use `no-store` — caching it in Next's URL-keyed Data Cache could
// serve one user's permissions to another. The backend already serves it from a
// per-user Redis cache, so an uncached fetch here is still cheap.
export interface MyPermissions {
  permissions: string[];
  role: { id: string; code: string; name: string } | null;
}

const EMPTY: MyPermissions = { permissions: [], role: null };

export async function getMyPermissions(accessToken: string | undefined): Promise<{
  data: MyPermissions;
  /** False when the fetch failed — lets callers fail-open (don't force /no-role on a
   *  transient blip) while still enforcing on the backend. */
  loaded: boolean;
}> {
  if (!accessToken) return { data: EMPTY, loaded: false };

  const base = process.env.NEXT_PUBLIC_BACKEND_API ?? '';
  try {
    const res = await fetch(`${base}api/v1/auth/me/permissions/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return { data: EMPTY, loaded: false };

    const body = (await res.json()) as { data?: Partial<MyPermissions> };
    return {
      data: {
        permissions: body.data?.permissions ?? [],
        role: body.data?.role ?? null,
      },
      loaded: true,
    };
  } catch {
    return { data: EMPTY, loaded: false };
  }
}
