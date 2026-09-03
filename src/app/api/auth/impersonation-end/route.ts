import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import axios from 'axios';

import { persistSession } from '@/lib/auth/sessionCookie';

const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_BACKEND_API ?? 'http://localhost:8000/').replace(
  /\/*$/,
  '/'
);

/**
 * End a support-impersonation session and restore the admin's own.
 *
 * Two things have to happen and the order matters: tell the backend to close the
 * grant, then swap the parked tokens back into the cookie. If the restore ran
 * first, a failure at the backend would leave the admin holding their own session
 * while a live grant stayed open with nothing pointing at it.
 *
 * The backend call is best-effort *after* it has been attempted: if the grant has
 * already expired or been ended elsewhere, the local restore must still happen, or
 * the admin is stranded in a session that no longer authenticates.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: request, secret });

  if (!token || !secret) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const prior = token.priorSession;
  if (!prior) {
    return NextResponse.json({ error: 'not impersonating' }, { status: 409 });
  }

  if (token.accessToken) {
    try {
      await axios.post(
        `${BACKEND_ORIGIN}api/v1/impersonation/end/`,
        {},
        { headers: { Authorization: `Bearer ${token.accessToken}` } }
      );
    } catch {
      // Already expired, already ended, or the backend is unreachable. The grant
      // is time-boxed and re-checked per request, so the worst case is that it
      // lapses on its own — whereas refusing to restore here would strand the
      // admin in a session that cannot authenticate.
    }
  }

  token.accessToken = prior.accessToken;
  token.backendRefreshToken = prior.backendRefreshToken;
  token.user = prior.user;
  token.impersonation = null;
  token.priorSession = null;

  const response = NextResponse.json({ ended: true });
  await persistSession(response, token, secret);
  return response;
}
