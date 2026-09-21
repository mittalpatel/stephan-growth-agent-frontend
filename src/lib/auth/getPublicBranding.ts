import 'server-only';
import { cache } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { CUSTOM_DOMAINS_ENABLED } from '@/constants/features';
import { serverBackendOrigin } from '@/lib/serverBackendOrigin';
import type { PublicBranding } from '@/types/settings';

/**
 * Branding for the custom domain this request was served on, for the pages that
 * render before anyone signs in (`/`, `/login`, ...). `null` for the platform's own
 * host, an unverified domain, or any failure, so those pages simply stay
 * platform-branded.
 *
 * `GET /public/branding/?host=` lives outside `/api/v1/` and needs no auth. The Host
 * header only selects whose public branding to look up, so a spoofed one reveals
 * nothing the real domain does not already show any visitor. Not cached: it is
 * per-host and small, and a rename should show on the next load.
 *
 * Short-circuited while custom domains are off. Without them there is no verified
 * domain for the lookup to match, so every call is a backend round trip that can only
 * return null, on the first paint of the landing and auth pages. Signed-in branding is
 * unaffected: it comes from `GET /settings/brand/summary/` and never needed a domain.
 */
export const getPublicBranding = cache(async (): Promise<PublicBranding | null> => {
  if (!CUSTOM_DOMAINS_ENABLED) return null;

  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  if (!host) return null;

  try {
    const res = await fetch(
      `${serverBackendOrigin()}public/branding/?host=${encodeURIComponent(host)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: PublicBranding };
    return body.data ?? null;
  } catch {
    return null;
  }
});

/**
 * Tab title and favicon for a signed-out page on a branded domain. Overrides the
 * root layout's `%s | YB Inspire` template; empty (so the platform's stands) when
 * there is no branding.
 */
export function publicBrandingMetadata(branding: PublicBranding | null): Metadata {
  const name = branding?.display_name.trim();
  if (!branding || !name) return {};
  const favicon = branding.favicon_url.trim();
  return {
    title: { default: name, template: `%s | ${name}` },
    ...(favicon ? { icons: { icon: favicon } } : {}),
  };
}
