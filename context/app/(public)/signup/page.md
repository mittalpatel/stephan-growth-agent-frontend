# Signup

**Source:** `src/app/(public)/signup/page.tsx`

Invite-only account activation. Signup is **not** open registration.

`useSignupInvite` validates the token in the query string before anything renders. An
invalid, expired, or already-used invite falls through to `notFound()` rather than
showing a form that cannot succeed.

The email field is read-only: it is fixed by the invite, and letting it be edited would
only produce a server-side rejection after the user has filled in everything else.

| Method | Endpoint                                |
| ------ | --------------------------------------- |
| GET    | `/api/v1/auth/invite/validate/?token=…` |
| POST   | `/api/v1/auth/signup/`                  |

`SIGNUP_SECRET_TOKEN` (optional, in `.env`) is an additional shared secret the backend
can require on top of the invite token.
