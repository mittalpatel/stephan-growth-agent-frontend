# Forgot Password

**Source:** `src/app/(public)/forgot-password/page.tsx`

Three steps in one route, driven by `useForgotPasswordForm`: request a code, verify it,
choose a new password. Each step has its own Zod schema and RHF instance; the shared
chrome comes from `AuthHeroShell`, which takes the step's subtitle as a prop.

## Steps

| Step       | Endpoint                                    | Notes                       |
| ---------- | ------------------------------------------- | --------------------------- |
| `email`    | `POST /api/v1/auth/password-reset/request/` | Always reports success      |
| `otp`      | `POST /api/v1/auth/password-reset/verify/`  | 6-digit code                |
| `password` | `POST /api/v1/auth/password-reset/confirm/` | New password + confirmation |

The request step deliberately returns the same message whether or not the account
exists (`t.auth.forgotPasswordFlow.requestSent`). Distinguishing them turns the form
into an account-enumeration oracle.

Uses `axiosPublic`, not `axiosAuth` — there is no session yet, and the public client
attaches no token and attempts no refresh on 401.

The external-IdP hint is shown on the first two steps: the backend refuses credential
resets for identity-provider accounts, and without the hint that refusal looks broken.
