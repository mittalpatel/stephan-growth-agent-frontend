import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import axios from 'axios';

import { serverBackendOrigin } from '@/lib/serverBackendOrigin';

/**
 * Mint a short-lived, single-use WebSocket ticket, server-side only.
 *
 * The browser never gets the real access token (see `axiosAuth.ts` and
 * `authOptions.ts`'s session callback) — a `WebSocket` can't attach an
 * `Authorization` header, and putting the real token in a `wss://` query
 * string would both violate that invariant and risk it landing in a proxy's
 * access log. This route is the one place the real token and the
 * ticket-minting call meet: it reads the token from the httpOnly cookie the
 * same way `getServerAccessToken.ts` does, asks the backend for a ticket
 * scoped to *this* session, and hands back only that opaque, ~30s,
 * single-use ticket for the browser to open `wss://.../ws/realtime/?ticket=`
 * with directly.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: request, secret });

  if (!token?.accessToken) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const url = `${BACKEND_ORIGIN}api/v1/auth/realtime/ws-ticket/`;
  try {
    const { data } = await axios.post(
      url,
      {},
      { headers: { Authorization: `Bearer ${token.accessToken}` } }
    );
    const ticket = data?.data?.ticket;
    if (typeof ticket !== 'string') {
      return NextResponse.json({ error: 'ticket mint failed' }, { status: 502 });
    }
    return NextResponse.json({ ticket });
  } catch (err) {
    const error = err as { response?: { status?: number } };
    const status = error?.response?.status ?? 502;
    return NextResponse.json({ error: 'ticket mint failed' }, { status });
  }
}

const BACKEND_ORIGIN = serverBackendOrigin().replace(/\/*$/, '/');
