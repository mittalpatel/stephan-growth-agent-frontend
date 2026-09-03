'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Session } from 'next-auth';

interface UserContextValue {
  session: Session;
}

const UserContext = createContext<UserContextValue | null>(null);

/**
 * The session, or `null` when there is no provider above.
 *
 * For consumers that must not hard-fail without one — `PermissionGuard` renders
 * in tests and in trees that predate the provider, and a missing session there
 * should read as "not a superuser", not as a crash.
 */
export function useOptionalUser() {
  return useContext(UserContext);
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserContext.Provider');
  return ctx;
}

export default function UserContextProvider({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ session }), [session]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
