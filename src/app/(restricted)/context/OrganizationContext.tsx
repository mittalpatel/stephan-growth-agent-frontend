'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import axiosAuth, { SAME_ORIGIN_ROUTE } from '@/client/axiosAuth';
import { clearQueryCache } from '@/lib/queryClientRef';
import { ORGANIZATION_SWITCH_ROUTE } from '@/services/organizations';
import type { OrganizationSummary } from '@/types/next-auth';

/**
 * The organization the session is currently acting in.
 *
 * Present in both tenancy modes. A single-tenant deployment resolves every request
 * to one implicit organization, so `organizations` holds a single entry and
 * `isMultiTenant` is false — which is all the UI needs to hide the switcher. There
 * is deliberately no second code path for single-tenant.
 *
 * The active organization is decided by the **signed JWT claim**, not by this
 * context. Switching therefore has to go to the backend for a new token pair;
 * mutating this value client-side would change what the UI renders while the
 * backend kept answering for the old tenant.
 */
interface OrganizationContextValue {
  organization: OrganizationSummary | null;
  organizations: OrganizationSummary[];
  isMultiTenant: boolean;
  isSwitching: boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

interface Props {
  organization: OrganizationSummary | null;
  organizations: OrganizationSummary[];
  children: React.ReactNode;
}

export default function OrganizationProvider({
  organization: initialOrganization,
  organizations: initialOrganizations,
  children,
}: Props) {
  const { update } = useSession();
  const [organization, setOrganization] = useState(initialOrganization);
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [isSwitching, setIsSwitching] = useState(false);

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      if (organizationId === organization?.id) return;
      setIsSwitching(true);
      try {
        // Via a server route, not the backend directly. The switch mints a fresh
        // token pair, and the refresh token in it is a multi-day credential — it
        // must never pass through client JavaScript, which is exactly what
        // handing the response to `update({ access, refresh })` used to do. The
        // route writes both tokens straight into the httpOnly cookie and returns
        // only the user object; see api/auth/organization-switch/route.ts.
        const { data } = await axiosAuth.post(
          ORGANIZATION_SWITCH_ROUTE,
          { organizationId },
          SAME_ORIGIN_ROUTE
        );
        const user = data?.user ?? null;

        // Re-read the session from the cookie the route just rewrote. Until this
        // resolves the browser still holds a session describing the *previous*
        // organization, so any request issued in between would render the old
        // tenant's context.
        await update();

        setOrganization(user?.organization ?? null);
        setOrganizations(user?.organizations ?? []);

        // Every cached query was keyed without an organization dimension, so it
        // now describes the wrong tenant. Dropping the cache is not a nicety —
        // keeping it would render the previous organization's data under the new
        // organization's name.
        clearQueryCache();
      } finally {
        setIsSwitching(false);
      }
    },
    [organization?.id, update]
  );

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organization,
      organizations,
      // More than one reachable organization is the only signal the UI needs:
      // it never reads the backend flag directly.
      isMultiTenant: organizations.length > 1,
      isSwitching,
      switchOrganization,
    }),
    [organization, organizations, isSwitching, switchOrganization]
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
