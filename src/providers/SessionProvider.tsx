'use client';

import { SessionProvider as NextAuthSessionProvider, signOut } from 'next-auth/react';
import { useEffect } from 'react';

function CrossTabLogout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const channel = new BroadcastChannel('auth');
    channel.onmessage = (event) => {
      if (event.data === 'signout') {
        signOut({ redirect: true, callbackUrl: '/login' });
      }
    };
    return () => channel.close();
  }, []);

  return <>{children}</>;
}

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <CrossTabLogout>{children}</CrossTabLogout>
    </NextAuthSessionProvider>
  );
}
