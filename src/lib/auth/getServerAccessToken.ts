import 'server-only';
import { cookies, headers } from 'next/headers';
import { getToken } from 'next-auth/jwt';

// Reads the backend access token directly from the encrypted JWT cookie —
// NOT from getServerSession()/session.accessToken, which no longer carries it
// at all (see types/next-auth.d.ts): whatever the `session()` callback returns
// is exactly what GET /api/auth/session hands to client JS, so the token can
// never live there. next-auth's getToken() decodes the httpOnly cookie
// directly instead, which is the same mechanism src/proxy.ts and
// /api/auth/refresh/route.ts already use — this is the Server Component
// equivalent, using next/headers instead of a NextRequest.
export async function getServerAccessToken(): Promise<string | undefined> {
  // next-auth's getToken() only actually uses `.cookies`/`.headers` off `req`
  // (see node_modules/next-auth/jwt/index.js) — it duck-types against
  // NextRequest/IncomingMessage, neither of which next/headers()'s
  // Server-Component-only cookies()/headers() structurally satisfy, hence the
  // cast through `unknown`.
  const req = { cookies: await cookies(), headers: await headers() } as unknown as Parameters<
    typeof getToken
  >[0]['req'];
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return token?.accessToken;
}
