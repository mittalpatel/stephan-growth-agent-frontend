import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import axios from 'axios';

import { serverBackendOrigin } from '@/lib/serverBackendOrigin';

// Blacklists the backend refresh token before next-auth clears the session
// cookie. Without this, the refresh token stays valid for its full 7-day
// lifetime even after the user logs out — a logout should invalidate it
// immediately. The endpoint is idempotent: sending an already-blacklisted
// token returns 200, so double-calls are safe.
export async function POST(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: request, secret });
  const refresh = token?.backendRefreshToken;
  const access = token?.accessToken;

  if (!token || !refresh || !access) {
    return NextResponse.json({ ok: true });
  }

  try {
    await axios.post(
      `${serverBackendOrigin().replace(/\/*$/, '/')}api/v1/auth/logout/`,
      { refresh },
      { headers: { Authorization: `Bearer ${access}` } }
    );
  } catch {
    // Non-fatal — the client will clear the session regardless. A network
    // error or already-blacklisted token shouldn't block the user from
    // logging out of the frontend.
  }

  return NextResponse.json({ ok: true });
}
