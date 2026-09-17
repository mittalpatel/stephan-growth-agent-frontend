import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import axios from 'axios';

import { persistSession } from '@/lib/auth/sessionCookie';
import { serverBackendOrigin } from '@/lib/serverBackendOrigin';

// Refreshes the backend access token server-side. The refresh token lives only
// in the encrypted next-auth JWT cookie (token.backendRefreshToken) and is never
// exposed to client JS — the browser calls this same-origin route instead.
//
// The backend rotates the refresh token on every call (BLACKLIST_AFTER_ROTATION):
// the refresh token just used is blacklisted, so the rotated one returned here
// MUST be written back into the session cookie, or the next refresh will reuse an
// already-blacklisted token and force an unwanted logout days before the session
// should actually expire.
export async function POST(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: request, secret });
  const refresh = token?.backendRefreshToken;

  if (!token || !refresh || !secret) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  const url = `${serverBackendOrigin().replace(/\/*$/, '/')}api/v1/auth/token/refresh/`;
  try {
    const { data } = await axios.post(url, { refresh });

    token.accessToken = data.access;
    token.backendRefreshToken = data.refresh;

    // The new access token is never returned in the body — the caller (axiosAuth's
    // 401 handler) doesn't need it: retrying through /api/backend picks up the
    // rotated token automatically, since that proxy always reads it fresh from
    // this same cookie. Returning it here would be one more place the raw token
    // briefly exists in a client-readable response.
    const response = NextResponse.json({ refreshed: true });
    await persistSession(response, token, secret);
    return response;
  } catch (err) {
    const error = err as { response?: { status?: number; data?: unknown }; message?: string };
    console.error('[auth] refresh request failed', {
      url,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
  }
}
