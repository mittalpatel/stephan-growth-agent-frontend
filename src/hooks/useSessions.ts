'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { t } from '@/locales';
import {
  SESSIONS_LIST_ENDPOINT,
  sessionRevokeEndpoint,
  type AuthEnvelope,
  type SessionRow,
} from '@/services/sessions';

const copy = t.userProfile.sessions;

const SESSIONS_LIST_KEY = ['sessions', 'list'];

// Another tab/device revoking a session, or a genuinely new sign-in, should
// show up here without the user having to reload the page. `useRealtimeSocket`
// (mounted in `LayoutWrapper`) now pushes an instant sign-out the moment *this*
// session is the one revoked; this poll stays as the fail-open backstop for
// everything else (a new sign-in appearing in the list, or a socket that never
// connected), and is why the interval is still short rather than removed.
const SESSIONS_POLL_INTERVAL_MS = 10_000;

/** Self-service session (device) list and per-session revoke — Slice C. */
export function useSessions() {
  const listQuery = useAuthQuery<AuthEnvelope<SessionRow[]>>(
    SESSIONS_LIST_KEY,
    SESSIONS_LIST_ENDPOINT,
    { refetchInterval: SESSIONS_POLL_INTERVAL_MS, refetchOnWindowFocus: true }
  );
  const sessions = listQuery.data?.data ?? [];

  const [pendingJti, setPendingJti] = useState<string | null>(null);
  const revokeMutation = useAuthMutation<AuthEnvelope<null>>();

  async function revoke(jti: string) {
    setPendingJti(jti);
    try {
      await revokeMutation.mutateAsync({ url: sessionRevokeEndpoint(jti), method: 'delete' });
      const revokedCurrentSession = sessions.find((s) => s.jti === jti)?.is_current ?? false;
      if (revokedCurrentSession) {
        // The refresh token backing *this* browser's own session was just
        // blacklisted server-side — the NextAuth JWT cookie is still valid
        // and would otherwise keep the user looking "signed in" until it
        // next tries (and fails) to refresh. Sign out immediately instead
        // of leaving that stale, already-revoked session in place.
        toast.success(copy.revoked);
        await signOut({ redirect: true, callbackUrl: '/login' });
        return;
      }
      toast.success(copy.revoked);
      await listQuery.refetch();
    } catch (err) {
      applyApiError(err, { fallbackMessage: copy.revokeFailed });
    } finally {
      setPendingJti(null);
    }
  }

  return {
    isLoading: listQuery.isLoading,
    sessions,
    revoke,
    pendingJti,
  };
}
