import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import axios from 'axios';

import { persistSession } from '@/lib/auth/sessionCookie';

/**
 * Switch the session's active organization, server-side.
 *
 * The backend mints a **fresh token pair** whose signed `org_id` claim names the
 * new tenant — the active organization is never changed client-side alone, since
 * the token is the authority and a session object edited in the browser grants
 * nothing the backend will honour.
 *
 * That pair must never reach the browser. The previous implementation called the
 * switch endpoint from `OrganizationContext` and passed the result back through
 * `useSession().update({ access, refresh })`, which put the **refresh** token —
 * the long-lived credential, good for the whole session lifetime — into
 * client-readable JavaScript. That defeats the reason `/api/backend/[...path]`
 * exists: the BFF proxy was built so the short-lived access token never leaves
 * the server, and leaking the refresh token instead is strictly worse. Any XSS
 * during a switch would capture a credential that outlives the page by days.
 *
 * So the whole exchange happens here: this route reads the current access token
 * from the httpOnly cookie, calls the backend, writes the new pair straight back
 * into that cookie, and returns only the non-secret user payload the UI needs to
 * re-render. No token appears in the response body.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: request, secret });

  if (!token?.accessToken || !secret) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let organizationId: unknown;
  try {
    ({ organizationId } = await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  // Path-segment interpolation, so it must not be attacker-shaped. Anything other
  // than a UUID is rejected outright rather than concatenated into the URL.
  if (typeof organizationId !== 'string' || !UUID_RE.test(organizationId)) {
    return NextResponse.json({ error: 'invalid organization id' }, { status: 400 });
  }

  const url = `${BACKEND_ORIGIN}api/v1/organizations/${organizationId}/switch/`;
  try {
    const { data } = await axios.post(
      url,
      {},
      { headers: { Authorization: `Bearer ${token.accessToken}` } }
    );
    const payload = data?.data ?? {};

    if (!payload.access || !payload.refresh) {
      return NextResponse.json({ error: 'switch failed' }, { status: 502 });
    }

    token.accessToken = payload.access;
    token.backendRefreshToken = payload.refresh;
    if (payload.user) {
      token.user = payload.user;
    }

    // Only the user object — which the client already receives via the session —
    // travels back. The tokens stay in the cookie.
    const response = NextResponse.json({ user: payload.user ?? null });
    await persistSession(response, token, secret);
    return response;
  } catch (err) {
    const error = err as { response?: { status?: number } };
    // The backend answers 404 for an organization the caller does not belong to,
    // deliberately indistinguishable from one that does not exist. Pass the status
    // through rather than flattening it, so the UI can tell "not yours" from "the
    // backend is down".
    const status = error?.response?.status ?? 502;
    return NextResponse.json({ error: 'switch failed' }, { status });
  }
}

const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_BACKEND_API ?? 'http://localhost:8000/').replace(
  /\/*$/,
  '/'
);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
