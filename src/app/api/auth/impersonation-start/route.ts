import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import axios from 'axios';

import { persistSession } from '@/lib/auth/sessionCookie';
import { serverBackendOrigin } from '@/lib/serverBackendOrigin';

const BACKEND_ORIGIN = serverBackendOrigin().replace(/\/*$/, '/');

/**
 * Start a support-impersonation session, server-side.
 *
 * The backend returns a token pair acting as the target user. Like the
 * organization switch and the password change, that pair must never pass through
 * the browser — the refresh token is a multi-day credential, and here it is a
 * credential *for someone else's account*, which makes the usual argument
 * considerably sharper.
 *
 * The admin's own tokens are parked in `priorSession` before being overwritten, so
 * ending the session restores them rather than logging the admin out. That is not
 * a convenience: an admin who gets logged out every time they finish will stop
 * ending sessions and start closing the tab, leaving live grants behind.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: request, secret });

  if (!token?.accessToken || !secret) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // Refuse to stack sessions client-side too. The backend refuses as well
  // (NotImpersonated on the start endpoint); doing it here keeps `priorSession`
  // from being overwritten with an impersonated pair, which would strand the
  // admin's real session with no way back.
  if (token.impersonation) {
    return NextResponse.json({ error: 'already impersonating' }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  try {
    const { data } = await axios.post(`${BACKEND_ORIGIN}api/v1/impersonation/start/`, body, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    });
    const payload = data?.data ?? {};

    if (!payload.access || !payload.refresh) {
      return NextResponse.json({ error: 'start failed' }, { status: 502 });
    }

    token.priorSession = {
      accessToken: token.accessToken,
      backendRefreshToken: token.backendRefreshToken ?? '',
      user: token.user!,
    };
    token.accessToken = payload.access;
    token.backendRefreshToken = payload.refresh;
    token.impersonation = payload.session ?? null;

    // Session metadata only — the banner needs it and it carries no credential.
    const response = NextResponse.json({ session: payload.session ?? null });
    await persistSession(response, token, secret);
    return response;
  } catch (err) {
    const error = err as { response?: { status?: number; data?: unknown } };
    // Validation errors (reason too short, target is staff, not a member) are
    // passed through so the form can bind them inline.
    return NextResponse.json(error?.response?.data ?? { error: 'start failed' }, {
      status: error?.response?.status ?? 502,
    });
  }
}
