import type { NextAuthOptions, User } from 'next-auth';
import type { OAuthConfig } from 'next-auth/providers/oauth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import axios, { type AxiosError } from 'axios';
import { DEFAULT_LANGUAGE } from '@/config/language';
import { t } from '@/locales';

import { getOidcProviders } from './oidcProviders';

// GitHub is plain OAuth2, not OIDC — it issues no id_token, so it can't join
// the generic OIDC provider loop below and needs its own well-known env var
// names (matching NextAuth's and GitHub's own docs) rather than the
// OIDC_<NAME>_* scheme. See the `signIn` callback for the access_token-based
// verification this implies on the backend side.
const GITHUB_PROVIDER_ID = 'github';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

const ACCEPT_LANGUAGE = { 'Accept-Language': DEFAULT_LANGUAGE };

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API ?? 'http://localhost:8000/';

interface AuthEnvelope<T> {
  success: boolean;
  message: string | null;
  data: T;
  meta: unknown;
  // Field-keyed (`{ field: string[] }`) or a domain code (`{ code: string }`) —
  // see common/api/exceptions.py:custom_exception_handler.
  errors: (Record<string, string[]> & { code?: string }) | null;
}

interface LoginPayload {
  access?: string;
  refresh?: string;
  user?: unknown;
  // Present instead of the fields above when the account has MFA enabled —
  // see apps/users/services/auth_service.py:login_local. No real session is
  // issued until `verify_mfa_challenge` succeeds.
  mfa_required?: boolean;
  mfa_challenge?: string;
}

// All /api/v1/auth/* endpoints (except token/refresh and token/verify) respond
// with this envelope. On failure `success` is false and `message` is a
// human-readable string — except a 429, whose body is a generic backend
// string with no locale awareness of this frontend; that case is replaced
// with the same rate-limit copy `apiError.ts` uses for every other endpoint,
// countdown included when the backend sent `Retry-After`.
function extractEnvelopeError(error: AxiosError<AuthEnvelope<unknown>>): string {
  if (error.response?.status === 429) {
    const seconds = Number(error.response.headers?.['retry-after']);
    return Number.isFinite(seconds) && seconds > 0
      ? t.errors.rateLimitedRetry.replace('{seconds}', String(Math.ceil(seconds)))
      : t.errors.rateLimited;
  }
  const data = error?.response?.data;
  if (data?.message) return data.message;
  return error?.message || 'Something went wrong';
}

// The MFA-verify error codes apps/users/constants.py:AuthErrorCode can send —
// see apps/users/services/auth_service.py:verify_mfa_challenge.
const MFA_FATAL_CODES = new Set(['mfa_challenge_invalid', 'mfa_locked']);

// Match the backend refresh-token lifetime (SIMPLE_JWT REFRESH_TOKEN_LIFETIME_DAYS
// = 7 days) so the next-auth session JWT doesn't outlive the credential that can
// renew it. Without this, sessions default to 30 days, decoupled from the backend.
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function buildUser(innerUser: unknown): Record<string, unknown> {
  const u = innerUser as Record<string, unknown>;
  // Drop the permission list before it goes into the JWT session cookie. It's now
  // fetched out-of-band (GET /api/v1/auth/me/permissions/) and held client-side, so
  // keeping it here only bloats the cookie past the ~4KB browser limit (forcing
  // NextAuth chunking) and lets grants go stale until the next login. Identity +
  // role stay; authorization is always enforced server-side regardless.
  const identity = { ...u };
  delete identity.permissions;
  return {
    ...identity,
    full_name: `${String(u.first_name ?? '')} ${String(u.last_name ?? '')}`.trim(),
  };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_SECONDS },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        // Only sent on the second call of the MFA flow, once the first call
        // returned `mfa_required` — see useLoginForm.ts. Absent, `authorize`
        // takes the normal password path.
        mfaChallenge: { label: 'MFA Challenge', type: 'text' },
        mfaCode: { label: 'MFA Code', type: 'text' },
      },
      async authorize(credentials, req) {
        // The device/IP the backend records for its session list and
        // new-device login alert (apps/users/services/session.py:SessionBuilder)
        // must be the *browser's*, not this server's — `authorize()` runs on
        // the Next.js server and calls the backend directly via axios, so
        // without forwarding these explicitly, every login the backend ever
        // sees would carry axios's own default User-Agent and this server's
        // own egress IP, regardless of which real device signed in. That
        // silently made every session look identical and the new-device
        // alert unable to ever detect an actual new device — found by an E2E
        // run using a distinct User-Agent per simulated device, where the
        // backend still recorded the same one for all of them.
        // `req.headers` is the original incoming request's headers (per
        // next-auth's `RequestInternal` type) — genuinely the caller's
        // browser, not a value this code controls.
        const forwardedHeaders: Record<string, string> = { ...ACCEPT_LANGUAGE };
        const realUserAgent = req.headers?.['user-agent'];
        if (typeof realUserAgent === 'string') forwardedHeaders['User-Agent'] = realUserAgent;
        // Only meaningful if something in front of Next.js itself sets this
        // (e.g. a platform edge/proxy) — absent in bare local dev, where
        // there's nothing wrong with falling back to the direct connection.
        // common/api/client_ip.py's TRUSTED_PROXY_COUNT is what decides
        // whether the backend trusts it at all.
        const realForwardedFor = req.headers?.['x-forwarded-for'];
        if (typeof realForwardedFor === 'string') {
          forwardedHeaders['X-Forwarded-For'] = realForwardedFor;
        }

        // Step 2: exchange a challenge token + TOTP/recovery code for a session.
        // Identity travels entirely inside the (server-signed) challenge token,
        // so email/password are not re-sent here.
        if (credentials?.mfaChallenge && credentials?.mfaCode) {
          const url = `${BASE_URL}api/v1/auth/login/mfa/verify/`;
          try {
            const { data } = await axios.post<AuthEnvelope<LoginPayload>>(
              url,
              // Wire field is `token`, not `code` — see
              // apps/users/services/auth_service.py:verify_mfa_challenge's
              // docstring for why a field named `code` would corrupt the
              // error envelope's `errors.code` convention.
              { mfa_challenge: credentials.mfaChallenge, token: credentials.mfaCode },
              { headers: forwardedHeaders }
            );
            return data.data as unknown as import('next-auth').User;
          } catch (err) {
            const axiosErr = err as AxiosError<AuthEnvelope<unknown>>;
            const msg = extractEnvelopeError(axiosErr);
            const errorCode = axiosErr.response?.data?.errors?.code ?? '';
            // Only a dead/expired challenge or an account lockout should send
            // the user back to re-enter credentials — the challenge itself
            // is gone or unusable either way. A plain wrong code (or a
            // transient 429) should let them try again without losing their
            // place; distinct prefixes let useMfaVerifyForm.ts tell them
            // apart, since a thrown Error's message is the only channel back
            // to the client from a non-final `authorize()` call.
            //
            // The error *code* travels alongside the message (not just the
            // message) because the backend's wording for `mfa_invalid_code`
            // ("check the time on your device") only makes sense for a TOTP
            // guess — the client substitutes its own copy for a wrong
            // recovery code instead of showing that verbatim on
            // `/login/backup-code`. See MfaVerifyForm.tsx.
            if (MFA_FATAL_CODES.has(errorCode)) throw new Error(`MFA_FATAL::${msg}`);
            throw new Error(`MFA_RETRY::${errorCode}::${msg}`);
          }
        }

        if (!credentials?.email || !credentials?.password) return null;
        const url = `${BASE_URL}api/v1/auth/login/`;
        try {
          const { data } = await axios.post<AuthEnvelope<LoginPayload>>(
            url,
            {
              email: credentials.email,
              password: credentials.password,
            },
            { headers: forwardedHeaders }
          );
          if (data.data.mfa_required) {
            // Signals useLoginForm to switch to the code-entry step, carrying
            // the challenge token through the error message — NextAuth's
            // credentials flow has no other channel back to the client on a
            // non-final `authorize()` call.
            throw new Error(`MFA_REQUIRED::${data.data.mfa_challenge}`);
          }
          // The backend returns { access, refresh, user }, not a flat User shape;
          // the jwt callback below unwraps the nested `user` object itself.
          return data.data as unknown as import('next-auth').User;
        } catch (err) {
          if (err instanceof Error && err.message.startsWith('MFA_REQUIRED::')) throw err;
          const msg = extractEnvelopeError(err as AxiosError<AuthEnvelope<unknown>>);
          throw new Error(`LOGIN_ERROR::${msg}`);
        }
      },
    }),
    // Social login (generic OIDC) — config-driven, not one hard-coded provider.
    // NextAuth's own OIDC client does the actual authorization-code exchange
    // with the IdP (state/nonce/PKCE, all server-side); this app never talks
    // to the IdP for anything beyond that. The `signIn` callback below hands
    // the resulting id_token to the backend, which verifies it and mints our
    // own session — the provider's tokens never enter the session cookie.
    ...getOidcProviders().map(
      (provider): OAuthConfig<{ sub: string; email?: string; name?: string }> => ({
        id: provider.id,
        name: provider.label,
        // next-auth v4 folds OIDC support into the "oauth" provider type —
        // `wellKnown` + `idToken: true` below is what makes it OIDC-flavored
        // (discovery, PKCE/state/nonce, id_token verification internally).
        type: 'oauth',
        wellKnown: `${provider.issuer}/.well-known/openid-configuration`,
        clientId: provider.clientId,
        clientSecret: provider.clientSecret,
        checks: ['pkce', 'state'],
        idToken: true,
        authorization: { params: { scope: 'openid email profile' } },
        profile(profile) {
          // Display-only for NextAuth's own bookkeeping — the real identity
          // resolution happens on the backend from the verified id_token, not
          // from this object (its shape doesn't match our heavily-augmented
          // `User` interface, hence the cast). See the `signIn` callback below.
          return { id: profile.sub, email: profile.email ?? '', name: profile.name ?? '' } as User;
        },
      })
    ),
    // GitHub — plain OAuth2, registered via NextAuth's built-in provider
    // (not the generic OIDC loop above). Guarded on its own env vars so the
    // app still boots without them.
    ...(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET
      ? [GithubProvider({ clientId: GITHUB_CLIENT_ID, clientSecret: GITHUB_CLIENT_SECRET })]
      : []),
  ],
  callbacks: {
    // Only fires for the social-login (OIDC) providers — the credentials
    // provider's `authorize()` above already does its own exchange and never
    // reaches this callback with `account.provider !== 'credentials'`.
    async signIn({ account }) {
      if (!account || account.provider === 'credentials' || account.type !== 'oauth') return true;

      // GitHub has no id_token (plain OAuth2) — its opaque access_token is
      // what the backend verifies instead, by calling GitHub's own API with
      // it. Every other provider here is generic OIDC and sends id_token.
      // See OAuthService.exchange_github_token on the backend.
      const isGithub = account.provider === GITHUB_PROVIDER_ID;
      const payload = isGithub
        ? { access_token: account.access_token }
        : { id_token: account.id_token };
      if (!payload.access_token && !payload.id_token) return false;

      try {
        const url = `${BASE_URL}api/v1/auth/oauth/${account.provider}/exchange/`;
        const { data } = await axios.post<AuthEnvelope<LoginPayload>>(url, payload, {
          headers: ACCEPT_LANGUAGE,
        });
        if (data.data.mfa_required) {
          // Same shape as the credentials MFA step-up, minus the callbackUrl
          // hand-off (this callback has no access to it) — the OTP page picks
          // this up from the URL and finishes through the *same*
          // `login/mfa/verify/` exchange the credentials flow uses; see
          // useMfaVerifyForm.ts. No real session is created here.
          const challenge = encodeURIComponent(data.data.mfa_challenge ?? '');
          return `/login/otp?challenge=${challenge}`;
        }
        // Stash on `account` for the `jwt` callback below — mutating it here
        // is intentional and is the only channel from this callback to that
        // one for the same sign-in. Never the provider's own tokens: only
        // *our* backend-issued pair ever reaches the session.
        account.backendAccess = data.data.access;
        account.backendRefresh = data.data.refresh;
        account.backendUser = data.data.user;
        return true;
      } catch {
        // Generic failure, same as a bad password — no detail about *why*
        // the exchange failed is surfaced to an unauthenticated caller.
        return false;
      }
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user && account?.provider === 'credentials') {
        // Credentials provider: user IS the backend {access, refresh, user} payload.
        const innerUser = (user as unknown as { user: typeof user }).user ?? user;
        token.user = buildUser(innerUser) as unknown as typeof token.user;
        token.accessToken = user.access;
        token.backendRefreshToken = user.refresh;
      } else if (account?.backendAccess) {
        // Social login: the `signIn` callback above already verified the
        // provider's token with the backend and stashed the resulting
        // session here.
        token.user = buildUser(account.backendUser) as unknown as typeof token.user;
        token.accessToken = account.backendAccess;
        token.backendRefreshToken = account.backendRefresh;
      }
      // Display data only. `update()` is reachable from client JavaScript, so
      // whatever it can write is whatever an XSS payload can write — which is why
      // **no branch here accepts a token**. Both `access` and `refresh` used to be
      // settable this way, for token refresh and the organization switch; both now
      // happen in server route handlers that write the cookie directly
      // (api/auth/{refresh,organization-switch,change-password}/route.ts), so the
      // refresh token never enters the browser at all.
      //
      // Re-adding a token branch here would undo that in one line, and it would
      // cut both ways: not only could a token leak *out* through the response, an
      // attacker could inject one *in* and pin the session to a credential they
      // control. Anything that mints a token pair belongs in a route handler.
      if (trigger === 'update' && session?.user) {
        token.user = session.user as typeof token.user;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user!;
      // Deliberately exposed, unlike the tokens above it. The banner is the
      // control that stops an admin acting on the wrong tenant's data by mistake,
      // so it has to render from the session every page already has rather than
      // an extra request that can fail.
      session.impersonation = token.impersonation ?? null;
      // Deliberately NOT exposing accessToken here (see types/next-auth.d.ts):
      // whatever this callback returns is exactly what GET /api/auth/session
      // and useSession()/getSession() hand to any script running on the page.
      // Server-only code that needs the raw access token reads it from the JWT
      // directly — see lib/auth/getServerAccessToken.ts — never from this object.
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
