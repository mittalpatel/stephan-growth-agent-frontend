'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axiosAuth from '@/client/axiosAuth';
import {
  can as canWith,
  hasAccess as hasAccessWith,
  hasFunctionalPermission as hasFunctionalWith,
  getDefaultRoute as getDefaultRouteWith,
  type PermissionAction,
} from '@/lib/helper';
import type { PermissionLevel } from '@/constants/roles';
import type { MyPermissions } from '@/lib/auth/getMyPermissions';

// Holds the user's effective permission codes so every client consumer reads them
// from one place instead of the session. The restricted layout seeds this with a
// server-side fetch for correct first paint, but the value shown is authoritatively
// (re)fetched client-side via axiosAuth on mount — see the effect below.
//
// `loaded` distinguishes "fetch succeeded, user genuinely has none" (→ /no-role)
// from "not resolved yet / fetch failed" (fail-open — the backend still enforces).
interface PermissionsContextValue {
  permissions: string[];
  role: MyPermissions['role'];
  loaded: boolean;
  can: (resource: string, action: PermissionAction) => boolean;
  hasFunctional: (functionName: string, level?: PermissionLevel) => boolean;
  hasRouteAccess: (route: string, level?: PermissionLevel) => boolean;
  defaultRoute: () => string;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used inside PermissionsProvider');
  return ctx;
}

export default function PermissionsProvider({
  permissions: seedPermissions,
  role: seedRole,
  loaded: seedLoaded,
  children,
}: Readonly<{
  permissions: string[];
  role: MyPermissions['role'];
  loaded: boolean;
  children: React.ReactNode;
}>) {
  // Seed from the server fetch so the sidebar has permissions at first paint...
  const [state, setState] = useState<{
    permissions: string[];
    role: MyPermissions['role'];
    loaded: boolean;
  }>({ permissions: seedPermissions, role: seedRole, loaded: seedLoaded });

  // ...but the server reads the access token straight from the JWT cookie, which is
  // stale once the 60-min token has expired (the client rotates it in memory, never
  // back into the cookie). That makes the server fetch 401 → empty permissions →
  // empty sidebar. Refetch client-side through axiosAuth, which transparently
  // refreshes the token on 401, so the permission set is always correct regardless
  // of how old the cookie token is.
  useEffect(() => {
    let cancelled = false;
    axiosAuth
      .get('/api/v1/auth/me/permissions/')
      .then((res) => {
        if (cancelled) return;
        const data = (res.data?.data ?? {}) as Partial<MyPermissions>;
        setState({
          permissions: data.permissions ?? [],
          role: data.role ?? null,
          loaded: true,
        });
      })
      .catch(() => {
        if (cancelled) return;
        // Fetch failed (backend down, or a non-401 error). If the server already
        // seeded a real permission set, keep it — a transient blip shouldn't lock the
        // user out of pages they demonstrably have. But if we never resolved
        // permissions at all, mark `loaded` so the guard acts decisively (empty set →
        // redirect to /no-role) instead of failing open and rendering unauthorized
        // pages. (A 401 has already triggered axiosAuth's sign-out flow.)
        setState((s) => (s.loaded ? s : { permissions: [], role: null, loaded: true }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { permissions, role, loaded } = state;

  const value = useMemo<PermissionsContextValue>(
    () => ({
      permissions,
      role,
      loaded,
      can: (resource, action) => canWith(permissions, resource, action),
      hasFunctional: (functionName, level) => hasFunctionalWith(permissions, functionName, level),
      hasRouteAccess: (route, level) => hasAccessWith(permissions, route, level),
      defaultRoute: () => getDefaultRouteWith(permissions),
    }),
    [permissions, role, loaded]
  );
  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}
