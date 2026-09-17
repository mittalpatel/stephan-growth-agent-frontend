import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import axios from 'axios';

import { persistSession } from '@/lib/auth/sessionCookie';
import { serverBackendOrigin } from '@/lib/serverBackendOrigin';

const BACKEND_ORIGIN = serverBackendOrigin().replace(/\/*$/, '/');

/**
 * Change the password, server-side, and absorb the token rotation it causes.
 *
 * The backend revokes **every** outstanding refresh token when the password
 * changes — rotation renews a stolen token rather than expiring it, so a reset
 * that left other sessions alive would protect nothing. That includes this
 * session's own token, so the backend returns a replacement pair.
 *
 * Routing this through a server handler rather than the generic
 * `/api/backend/[...path]` proxy is the point: the generic proxy passes the
 * response body straight to the browser, which would hand client JavaScript a
 * fresh long-lived refresh token — the same leak the organization switch had.
 * Here the pair goes directly into the httpOnly cookie and the body the client
 * sees carries no credentials at all.
 *
 * Validation errors are passed through untouched (status and body), because the
 * form binds field-scoped backend errors inline via `applyApiError`.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: request, secret });

  if (!token?.accessToken || !secret) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const url = `${BACKEND_ORIGIN}api/v1/auth/change-password/`;
  try {
    const { data } = await axios.post(url, body, {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    });

    const rotated = data?.data ?? {};
    if (rotated.access && rotated.refresh) {
      token.accessToken = rotated.access;
      token.backendRefreshToken = rotated.refresh;
    }

    // `data: null` deliberately: the message drives the success toast, and the
    // tokens that came back are already in the cookie. Forwarding them would
    // reintroduce the exposure this route exists to close.
    const response = NextResponse.json({ ...data, data: null });
    await persistSession(response, token, secret);
    return response;
  } catch (err) {
    const error = err as { response?: { status?: number; data?: unknown } };
    const status = error?.response?.status ?? 502;
    return NextResponse.json(error?.response?.data ?? { error: 'change failed' }, { status });
  }
}
