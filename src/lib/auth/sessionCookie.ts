import 'server-only';
import { encode, type JWT } from 'next-auth/jwt';

/**
 * Writing a rotated backend token pair into the encrypted NextAuth session cookie.
 *
 * **The invariant this exists to hold:** the backend refresh token lives only in
 * the httpOnly session cookie and is never readable by client JavaScript. The
 * access token is short-lived and proxied server-side (`/api/backend/[...path]`);
 * the refresh token is the long-lived one, and handing it to the browser — even
 * momentarily, even only to pass it straight back via `useSession().update()` —
 * puts a multi-day credential inside the XSS blast radius that the BFF proxy and
 * the nonce-based CSP were both built to shrink.
 *
 * Any backend call that mints a *new* pair therefore has to happen in a route
 * handler, not in the browser. There are three such calls: token refresh, the
 * organization switch, and changing the password (the backend revokes every
 * outstanding refresh token on a credential change, so it must hand back a
 * replacement). Each one goes through `writeSessionCookie` below.
 */

export const SESSION_COOKIE_NAME = process.env.NEXTAUTH_URL?.startsWith('https://')
  ? '__Secure-next-auth.session-token'
  : 'next-auth.session-token';

// NextAuth chunks the session JWT across `${name}.0`, `.1`, … when it exceeds the
// browser's ~4096-byte per-cookie limit (our session embeds the user's full
// permission set, so it always does). We MUST write it back the same way — a single
// oversized cookie is silently dropped by the browser and, worse, left alongside the
// stale chunks, so the next `getSession()` fails to decode and the user object
// vanishes (name + permission-gated nav disappear) even though the access token
// still works. Mirror NextAuth's default chunk size and clear the unused form.
const CHUNK_SIZE = 3800;
const MAX_CHUNKS = 8;

type CookieWriter = { set: (name: string, value: string, opts: Record<string, unknown>) => void };

export function writeSessionCookie(
  cookies: CookieWriter,
  value: string,
  options: Record<string, unknown>
) {
  const clear = { ...options, maxAge: 0 };
  if (value.length <= CHUNK_SIZE) {
    cookies.set(SESSION_COOKIE_NAME, value, options);
    // Remove any chunk cookies left over from a previously larger session.
    for (let i = 0; i < MAX_CHUNKS; i++) cookies.set(`${SESSION_COOKIE_NAME}.${i}`, '', clear);
    return;
  }
  const chunks: string[] = [];
  for (let pos = 0; pos < value.length; pos += CHUNK_SIZE) {
    chunks.push(value.slice(pos, pos + CHUNK_SIZE));
  }
  chunks.forEach((chunk, i) => cookies.set(`${SESSION_COOKIE_NAME}.${i}`, chunk, options));
  // Drop the unchunked base cookie and any stale trailing chunks.
  cookies.set(SESSION_COOKIE_NAME, '', clear);
  for (let i = chunks.length; i < MAX_CHUNKS; i++) {
    cookies.set(`${SESSION_COOKIE_NAME}.${i}`, '', clear);
  }
}

/**
 * Re-encode `token` and set it as the session cookie on `response`.
 *
 * The session's original absolute expiry is preserved rather than slid forward:
 * rotating a token is not a reason to extend how long the session may live.
 */
export async function persistSession(
  response: { cookies: CookieWriter },
  token: JWT,
  secret: string
): Promise<void> {
  const exp = typeof token.exp === 'number' ? token.exp : undefined;
  const remainingMaxAge = exp ? Math.max(exp - Math.floor(Date.now() / 1000), 60) : undefined;

  const cookie = await encode({ token, secret, maxAge: remainingMaxAge });
  writeSessionCookie(response.cookies, cookie, {
    httpOnly: true,
    sameSite: 'lax',
    secure: SESSION_COOKIE_NAME.startsWith('__Secure-'),
    path: '/',
    maxAge: remainingMaxAge,
  });
}
