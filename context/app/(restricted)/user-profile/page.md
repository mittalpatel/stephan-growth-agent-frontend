# User Profile

**Source:** `src/app/(restricted)/user-profile/page.tsx`

Personal details and password. Reachable from the header profile menu; it is
deliberately **not** a sidebar entry, which is why `src/lib/pageMeta.ts` registers it
in `EXTRA` rather than deriving it from `NAV_ITEMS`.

## File map

```
src/app/(restricted)/user-profile/
  page.tsx
  components/UserProfileClient.tsx    # All state + both forms
  components/MfaSection.tsx           # Two-Factor Authentication card
  components/MfaEnrollDialog.tsx      # QR + confirm code (reveal-once secret)
  components/MfaDisableDialog.tsx     # Requires current code/recovery code to disable
  components/MfaRecoveryCodesDialog.tsx  # Reveal-once recovery codes (copy + download)
  components/SessionsSection.tsx      # Active Sessions card (list + revoke)
src/hooks/useUserProfile.ts
src/hooks/useMfa.ts
src/hooks/useSessions.ts
src/services/profile.ts               # Endpoints + payload types
src/services/mfa.ts                   # MFA endpoints + payload types
src/services/sessions.ts              # Session list/revoke endpoints + types
```

## Two-Factor Authentication (MFA)

Shown for **every** account, LOCAL and EXTERNAL (social login) alike — TOTP MFA is a
second factor layered on top of however the first factor is proven, and the backend
enforces the step-up identically for `login_local`, `verify_mfa_challenge`, and the
OIDC/GitHub exchange paths (`OAuthService.exchange_id_token`/
`exchange_github_token`), all via the same `MfaService.is_enabled` check. It used to
be LOCAL-only, back when `login_local` was the only path that ever issued a
challenge — see `UserProfileClient.tsx`'s comment above `<MfaSection />` and the
backend's `changelog/2026-08-26.md` ("Social login (generic OIDC)").

Enable shows a QR code (and manual-entry key) then asks for a confirmation code;
confirming reveals one-time recovery codes, with both a "Copy all" and a "Download"
(`recovery-codes.txt`, a local `Blob`, no network round trip) option.
**Disabling requires the current TOTP code or a recovery code** (`MfaDisableDialog.tsx`,
a controlled `Dialog`, not `AlertDialog` — a wrong code needs to keep it open with an
inline error) — an authenticated session alone is deliberately not sufficient, since
that would let a hijacked session permanently downgrade the account's security. It
also ends every other active session (`revoke_all_refresh_tokens`, same as a
password change) once the code checks out.

The QR/secret and recovery codes are held only in `useMfa`'s in-memory state — never
in the TanStack cache, a query key, or the URL — matching the API-keys secret
dialog's reveal-once discipline: the backend guarantees neither value is ever
returned a second time, so nothing here should either. See `context/auth.md` for the
login-challenge half of this feature.

## Active Sessions

Shown for **every** account, LOCAL and EXTERNAL alike — unlike MFA, a session is a
JWT refresh token, not an MFA-specific concept, so there's nothing to hide for an
IdP-managed account. Lists each outstanding session (device/IP, when it was created,
and a badge on whichever one is answering the current request) with a per-row
"Sign out" action, confirmed via the shared `ConfirmDialog` — a stronger warning
appears when the row being revoked is the viewer's own current session, since that
signs them out immediately.

Device and IP are captured server-side once, at token issuance, so "last seen" here
really means "when this session started," not a live heartbeat — see
`apps/users/services/session.py:SessionBuilder` in the backend. The current-session
flag comes from a `sid` claim on the access token that names its own refresh token's
JTI; the frontend never derives this itself.

Two behaviours here are easy to get wrong, and were:

- **Revoking your own session must also sign this browser out.** The backend
  blacklists the _refresh_ token, but the access token already in the next-auth
  cookie stays valid until it expires (up to an hour), so without an explicit
  `signOut()` the user keeps browsing and the button looks broken. `useSessions`
  calls it whenever the revoked row is the current one — which is also why the
  `is_current` flag has to be trustworthy, and for a long time it wasn't: it went
  false for every row once a session had rotated its refresh token. That was a
  backend bug (`SessionAwareTokenRefreshView`); this page could not have worked
  around it.
- **The list polls (10s) and refetches on focus** rather than loading once, so a
  session signed out from another device disappears here without a reload. This
  used to be the *only* way a revoked device found out — as of 2026-08-26,
  `useRealtimeSocket` (mounted in `LayoutWrapper`, not this page) pushes an
  instant `signOut()` over a WebSocket the moment this session is the one
  revoked, on whatever page happens to be open. The poll here stays as the
  fail-open backstop, not dead code.

## Local vs external accounts

`profile.registration_type` mirrors the backend's `RegistrationType`:

| Value      | Meaning                             | Effect here                           |
| ---------- | ----------------------------------- | ------------------------------------- |
| `local`    | Django-authenticated                | Name and password both editable       |
| `external` | Provisioned by an identity provider | Both read-only, with the reason shown |

An external account carries an unusable local password, and the backend refuses every
credential operation for it. The UI disables those controls and says why — a refusal
with no explanation reads as a bug.

The template ships no SSO provider; `external` exists as the seam. See
`src/lib/auth/authOptions.ts`.

## API

| Method | Endpoint                                      | Notes                                          |
| ------ | --------------------------------------------- | ---------------------------------------------- |
| GET    | `/api/v1/auth/profile/`                       | Current user's profile                         |
| PATCH  | `/api/v1/auth/profile/`                       | `first_name`, `last_name`                      |
| POST   | `/api/v1/auth/change-password/`               | Local accounts only                            |
| GET    | `/api/v1/auth/mfa/status/`                    | `{enabled}`                                    |
| POST   | `/api/v1/auth/mfa/setup/`                     | Returns QR + secret (once)                     |
| POST   | `/api/v1/auth/mfa/confirm/`                   | Returns recovery codes (once)                  |
| POST   | `/api/v1/auth/mfa/disable/`                   | Requires `token` (code); also revokes sessions |
| POST   | `/api/v1/auth/mfa/recovery-codes/regenerate/` | Returns new codes (once)                       |
| POST   | `/api/v1/auth/login/mfa/verify/`              | Exchanges challenge + code for a session       |
| GET    | `/api/v1/auth/sessions/`                      | Own outstanding sessions, `is_current` flagged |
| DELETE | `/api/v1/auth/sessions/<jti>/`                | Revoke one session by JTI                      |

Both forms use React Hook Form with Zod. Field names match the backend serializer
exactly so `applyApiError` binds server-side errors inline with no mapping table.
