# Public Signup

**Source:** `src/app/(public)/signup/create/page.tsx`

Open self-registration: details, then an emailed OTP confirms the address before the
account activates. Alongside, not instead of, the invite-only flow at `/signup` (see
`context/app/(public)/signup/page.md`) — this is a separate route, not a variant of it.

## File map

```
src/app/(public)/
  signup/create/page.tsx            # Server — metadata, renders PublicSignupForm
  components/PublicSignupForm.tsx   # Pure presenter, two steps
  hooks/usePublicSignupForm.ts      # All state and submission
```

## Flow

Driven entirely by `usePublicSignupForm`. The backend's `SIGNUP_OTP_VERIFICATION_ENABLED`
flag (off by default) decides whether an OTP step happens at all — the frontend has no
visibility into that flag and never reads or infers it. Instead `onDetailsSubmit`
branches on the actual shape of the `POST /api/v1/auth/public-signup/` response:

- **`data: null`** (flag on) — the account stays `is_active=False`, a 6-digit code is
  emailed, and the hook advances to the **OTP** step.
  `POST /api/v1/auth/public-signup/verify/` activates the account and assigns it the
  backend's configured default role (or, in multi-tenant mode, provisions the user's
  own organization). On success the hook calls
  `signIn('credentials', { email, password })` to establish the session through the
  normal NextAuth path — the same convention `useSignupForm` (the invite flow) uses,
  rather than hand-rolling a session from the verify response — then redirects to
  `DEFAULT_LANDING`. A "resend code" action calls
  `POST /api/v1/auth/public-signup/resend/` without changing steps.
- **`data` truthy** (flag off, the backend default) — the account activated
  immediately and there's nothing to verify. The hook skips the OTP step entirely and
  calls the same `signIn('credentials', ...)` + redirect path directly, using the
  same shared `signInAndRedirect` helper as the OTP-success path above.

Either way, if `signIn` fails (e.g. session establishment races a password change),
the hook falls back to `/login` rather than stranding the user on a dead step.

## Opt-in, not always on

The backend gates the whole feature behind `PUBLIC_SIGNUP_ENABLED` (off by default) —
see the users app's context doc in the backend template. This page and its route
exist unconditionally in the frontend; when the flag is off, the details-step
submission fails with the backend's "not enabled" message toasted via
`applyApiError`. There is no frontend-side flag to keep in sync.

## Error handling

`applyApiError` binds field-keyed and `email_already_registered`-style errors inline
on the details form, and `otp_invalid` / `otp_expired` inline on the OTP form —
same dispatcher, same convention as every other auth flow. An account that was
created but never verified, attempting to log in directly instead of finishing this
flow, gets the same generic `invalid_credentials` response as any other failed
login — the backend deliberately does not distinguish "unverified" from "wrong
password" or "no such account" at the login endpoint, since a distinct code there
would let an unauthenticated caller enumerate which emails are registered (see
`AuthService.login_local`'s docstring in the backend). The frontend's toast is
therefore the same generic message for all of these; a user stuck here is expected
to use "resend code" from this flow rather than be routed there automatically from
a failed login attempt.

## Updates 2026-10-07

Details step: both password fields have the login form's show/hide toggle, the
password has a strength bar (`PasswordStrengthMeter`, scored by
`passwordStrength` in the hook so a "Good"/"Strong" password always passes
the schema), and a required `accepted_terms` checkbox links to
`/legal/terms-conditions` and `/legal/privacy-policy`. `accepted_terms` is
sent in the signup body; the backend ignores it until it stores consent.
