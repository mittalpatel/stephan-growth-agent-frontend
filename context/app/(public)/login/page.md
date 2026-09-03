# Login Page

**Source:** `src/app/(public)/login/page.tsx`

## File map

```
src/app/(public)/
  login/page.tsx                # Server — metadata, Suspense, renders SignIn
  components/
    SignIn.tsx                  # Composes AuthHeroShell + LoginForm
    AuthHeroShell.tsx           # Shared chrome for all three public pages
    LoginForm.tsx               # Pure presenter
  hooks/useLoginForm.ts         # All state and submission
```

## Layout

A split-screen layout on medium+ screens via `AuthHeroShell`: a left branding panel
(logo mark, an "Enterprise ready" badge, tagline, and a short feature list on
`bg-brand-surface`, a token kept identical in both themes rather than derived from
`primary`) and the credentials card on the right. Below `md` the branding panel is
hidden and the same logo mark sits above the card instead.

There is deliberately no mount-fade. This is the first thing a user sees, and animating
it in puts a frame between them and the only control they came for.

## Form

React Hook Form with a Zod schema, through `useLoginForm`. The component renders; the
hook does everything else.

`noValidate` is set, so the browser does not intercept the submit and Zod is what
actually reports a malformed email. That is the path a paste or an autofill takes, so it
is the one worth testing.

Fields are labelled rather than placeholder-only: a placeholder disappears on focus and
is not reliably announced, so a placeholder-only field is unlabelled for a screen reader.

## What is deliberately absent

- **No "remember me".** The original rendered one bound to nothing — no schema field, no
  state, no effect on the session. Session lifetime is `session.maxAge` in
  `authOptions`, pinned to the backend's refresh-token lifetime. Wire it to a genuinely
  shorter or longer session before putting it back.
- **No SSO button.** The page renders credentials-only; `SocialLoginButtons`
  was removed. `src/lib/auth/oidcProviders.ts` and `authOptions.ts` still carry
  the generic OIDC provider wiring, so a direct `/api/auth/signin/<provider>`
  request or a re-added UI entry point works without a config change — see
  "Social login (generic OIDC)" below.

## Sign-up link

Below the submit button, a "Don't have an account? Sign up" link to `/signup/create`
— the public self-signup flow (see
`context/app/(public)/signup/create/page.md`). The link renders unconditionally; the
backend's `PUBLIC_SIGNUP_ENABLED` flag (off by default) is what actually gates
whether that route's first submission succeeds, so this is a link to an opt-in
feature, not a promise that it's on. `/signup` (no `/create` suffix) is the separate,
always-available admin-issued invite flow.

## Flow

`signIn('credentials')` → NextAuth `authorize()` → backend login → JWT stored in the
session cookie → redirect to `safeRedirect(callbackUrl)`, which falls back to
`DEFAULT_LANDING` and rejects absolute or protocol-relative URLs.

Wrong credentials keep the user on `/login` with the error surfaced through
`applyApiError`.

## Social login (generic OIDC)

No longer exposed on this page (the UI button list was removed) — this section
documents the still-wired backend path for a future entry point.
`signIn(<providerId>)` → NextAuth's own OIDC client does the authorization-code
exchange with the IdP entirely server-side (discovery, PKCE, state) → the
`signIn` callback in `authOptions.ts` hands the resulting `id_token` to the
backend's `POST /api/v1/auth/oauth/<provider>/exchange/` → same JWT-pair shape
as the credentials flow, stored the same way. An MFA-enrolled account gets
redirected to `/login/otp?challenge=...` instead of a session — see
`useMfaVerifyForm.ts`'s query-param hand-off, which exists only to serve this
path (the credentials flow hands the challenge off via `sessionStorage` from
client code instead, since it has a client-side step to do so from).
