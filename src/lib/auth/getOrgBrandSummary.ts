import 'server-only';
import type { BrandSummary } from '@/types/settings';

import { serverBackendOrigin } from '@/lib/serverBackendOrigin';

// Server-side fetch of the acting organization's white-label summary
// (`GET /settings/brand/summary/`, readable by any member), used for the browser
// tab title. `null` on any failure so the platform title stands rather than the
// page failing over cosmetics.
//
// SECURITY: per-tenant data behind a bearer token, so `no-store` only.
export async function getOrgBrandSummary(
  accessToken: string | undefined
): Promise<BrandSummary | null> {
  if (!accessToken) return null;

  try {
    const res = await fetch(`${serverBackendOrigin()}api/v1/settings/brand/summary/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: BrandSummary };
    return body.data ?? null;
  } catch {
    return null;
  }
}
