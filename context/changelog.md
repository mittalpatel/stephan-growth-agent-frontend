# Changelog

Most recent first. One entry per session that changes behaviour — what changed and
why, not a diff (`git log` already has that).

`AGENTS.md` makes this mandatory: a task is not complete until this file reflects it.

---

## 2026-09-03 — Rebranded the theme to the Nexus palette, and themed the public pages

The client-facing prototype (`ai-agents-platform`) set a visual direction: navy
primary, warm-neutral ramp, gold highlight, Manrope over Inter. Ported it as token
_values_ in `globals.css`, leaving every token _name_ stock so the shadcn primitives
inherit it with no component edits and future `shadcn add` still matches.

- Palette converted from the prototype's hex to `oklch`, per the file's existing
  convention. Dark mode was derived rather than invented: each token keeps its
  light-mode hue and swaps lightness, since the prototype ships light mode only and
  leaving `.dark` on stock neutral would have made the two themes look like different
  products.
- One token pair added, `--brand-accent`. shadcn's `--accent` is the hover/active
  surface, so routing a saturated gold through it would have tinted every hover.
- `--radius` 0.625rem to 0.75rem, so `rounded-xl` lands on the 16px card roundness the
  design uses.
- Fonts: Geist to Manrope (display) plus Inter (body) plus JetBrains Mono (numerics),
  all self-hosted through `next/font`.
- **Fixed a latent bug:** `font-heading` was referenced by four generated `ui/`
  primitives (card, dialog, alert-dialog, sheet) and by `HeaderOne`, but no
  `--font-heading` token was ever declared, so the utility was inert and every one of
  those titles silently fell back to the body font. It is now an alias of
  `--font-display`.
- `StatusBadge` gained a decorative `aria-hidden` dot.
- Public pages themed: `AuthHeroShell` (display face on the hero and card titles, a
  soft brand-accent highlight behind the navy panel, flat border instead of a shadow)
  and `not-found`, whose decorative blob referenced a `bg-brand` token that never
  existed and therefore rendered as nothing.

Two problems were then found by screenshotting the result rather than reading the
CSS, and both are fixed:

- **The hero panel was a pale slab in dark mode.** It used `bg-primary`, but
  `--primary` is a control fill, so dark mode lightens it. Correct for a button,
  wrong for a full-height panel. This predates the rebrand: in stock shadcn, dark
  `--primary` is near-white, so the panel was a *white* slab before. Added a
  `--brand-surface` pair that holds the same navy in both themes, since a brand
  surface is not theme-dependent.
- **The decorative highlight was removed.** Drawn in the brand accent at 20% and
  blurred across a 24rem circle, it banded badly over the navy and read as grey-green
  rather than gold. A flat panel beats a cheap gradient.

Restricted pages were deliberately left alone; they get their pass once the backend
work starts. `src/components/ui/**` was left untouched on purpose after an initial
attempt to swap Card's ring for a border: that directory is generated, so the edit
would not survive regeneration. The remaining visual gap between our cards and the
prototype's is exactly that ring-versus-border edge.

## 2026-09-02 — Built the transfer-ownership UI for the existing backend endpoint

QA's §7.1 flagged `OrganizationTransferOwnershipView` as a live, permission-gated
backend endpoint with zero frontend surface. Closed it out: `OrganizationSettingsView`'s
danger zone now has a "Transfer ownership" control (member picker + confirm dialog),
gated on `can('organization', 'transfer')` — Owner-only, same as delete. The outgoing
owner keeps Admin access rather than losing it (matches
`OrganizationService.transfer_ownership`'s own behavior), and the picker excludes the
caller since transferring to yourself is a no-op. New e2e coverage transfers ownership
live, confirms the former Owner loses the danger zone on refresh, and transfers back
so the seed's Owner/Admin split stays as every other spec expects it. `organization:billing`
remains an intentional gap — seeded permission, no view, no UI — left for a product
decision on whether it's ever getting built.

## 2026-09-02 — Two real bugs found by actually running the impersonation and file-permission flows

Continuing the pattern from yesterday: running the previously-`Not Executed`
e2e specs against a live stack, not just reading them, surfaced two more bugs
that unit tests structurally could not have caught.

- **Editor-grant Members couldn't delete their own files.** `ProjectFilesSection`
  decided whether to show the delete button using `useProjectAccess`'s roster
  query, which requires `project:access_manage` — a permission Member never
  holds, even with an editor grant on that exact project. The query 403'd,
  `hasEditorGrant` silently fell back to `false`, and the delete button never
  rendered, despite the backend already allowing the write. Added a new
  `project:view`-gated endpoint (`.../access/mine/`) that answers "what's my
  own standing on this project" without exposing the roster, and a matching
  `useMyProjectAccess` hook. Verified live: upload, preview, and delete all
  work now for an editor-grant Member.
- **Impersonation was completely broken the moment anyone actually tried it.**
  Both the admin's user-lookup and the per-request liveness check that runs
  for every action taken during an impersonation session called into a
  tenant-isolation helper that requires an open database transaction and
  refuses to run without one — neither call site had one, so both 500'd.
  Backend-side fix (see today's backend changelog); this repo's contribution
  was catching it, since no prior run of the impersonation e2e spec had a
  seeded superuser account to actually exercise the flow with. Also fixed two
  spec bugs uncovered along the way: a share-dialog input that Radix's
  `PopoverTrigger` was silently making un-typeable (`type="button"` clobbering
  the `<Input>`'s own type — a real UI bug, not just a test issue), and an
  e2e script trying to drive a native `<select>` the way it would a Radix
  combobox.

## 2026-09-01 — Three real bugs found by actually running QA's new e2e specs

QA delivered ~15 new Playwright specs labelled "Confirmed (live)". Running them
against a real stack put 25 of 42 red. Most were environmental (the auth
throttle self-trips at 5/min — 49 `429`s in one run) or bad selectors, but
three were genuine product bugs no amount of source-reading had caught:

- **`/login/otp` bounced users back to `/login` with a valid challenge in
  storage.** `useMfaVerifyForm`'s `useHasStoredChallenge` returned a plain
  boolean from `useSyncExternalStore` with a `false` server snapshot, assuming
  React would resync to the real client value before any effect could act on
  it. It does not — on a _full page load_ (a refresh mid-flow, a bookmark) the
  redirect effect fired on the pre-resync `false`, discarding a live challenge
  and forcing the user to re-enter their password. Reproduced against a
  production build, not just dev. Now a tri-state (`null` = not read yet) so
  "haven't looked" is not confusable with "nothing there"; the redirect only
  fires on an explicit `false`. The URL-challenge (social-login) hand-off
  re-reads after it writes.
- **The auth shell overflowed horizontally on a 375px phone.** `AuthHeroShell`'s
  right-hand panel is a flex item with no `min-w-0`, so its automatic
  `min-width: auto` refused to shrink below content: the panel measured 480px
  inside a 375px viewport, scrolling every public auth page sideways. Worst on
  `/login/otp`, where the 6-box code input is the widest thing it holds. Adding
  `min-w-0` fixes all of them (boxes now shrink 60px → 42px, document
  `scrollWidth` back to 375).
- **Admins were shown the "delete this organization" danger zone.**
  `helper.ts`'s `MANAGE_IMPLIED` treated `delete` as implied by
  `resource:manage`, mirroring the backend's _declared_ contract — but not its
  actual enforcement, which never subsumed `delete` (see backend changelog).
  An Admin holds `organization:manage`, not `organization:delete`, so the
  control could only ever 403. `delete` removed from `MANAGE_IMPLIED` and
  `contracts/permissions.json` resynced from the corrected backend export
  (which also picked up the `project:create/update/delete` codes the vendored
  copy was missing). The only two `can(…, 'delete')` call sites — the org
  danger zone and project file delete — are both now correct; roles that may
  genuinely delete hold the explicit `:delete` code.

Spec fixes, none of which were product bugs: `impersonation.spec.ts` queried
the form title by `heading` role, but shadcn's `CardTitle` renders a plain
`<div>`; `responsive-layout.spec.ts` asserted `getByText(appName)` had count 0,
which can never pass (the panel is `hidden md:flex` — present but
`display:none`) and also collided with the copyright line that contains the app
name as a substring; `org-settings-owner-gating.spec.ts` read the org-name
field before its fetch had populated it (capturing `''` as the value to revert
to) and did its revert _after_ the assertions, so one failure left the seeded
org permanently renamed — the revert now lives in a `finally`.

## 2026-09-01 — Wired up file rename, which QA found had backend/hook support but no UI

`useProjectFiles.ts` already exposed a working `rename()` and the locale strings
existed, but `ProjectFilesSection.tsx` had no control calling it — the feature was
built from the hook down but never finished at the component.

- Added `RenameFileDialog` (mirrors `UploadFileDialog`'s shape: a dialog trigger,
  `react-hook-form` + the existing `projectFileUploadSchema` reused as-is since
  both forms are just `{ name }`) and wired it into the files table's action
  column next to Download/Delete.
- Gated on the same `canUploadFiles` check as Upload (org-wide `project:create`
  or an editor/manager grant) rather than the delete gate — renaming isn't
  destructive, so it belongs with the create/update-capable group.
- Added 2 tests to `ProjectFilesSection.test.tsx` (gating + submit-calls-rename).

## 2026-09-01 — Invite/role-change dropdown offered roles the backend would reject

QA flagged that an Admin could select "Owner" in the Invite Member dialog even
though the backend's permission-ceiling rule would reject it — a false
affordance discovered only after submitting. Investigating the backend side
turned up that the rejection didn't actually happen: `MembershipService`'s
invite and change-role paths never checked the ceiling at all, so this was a
real privilege-escalation gap, not just a UI polish issue (fixed
backend-side, see backend changelog 2026-09-01).

- `useOrganizationMembers` now filters the roles list against the caller's
  own held permission codes before handing it to the Invite dialog and the
  per-member role-change control — mirrors the backend's
  `assert_within_ceiling` exactly (a role is offered only if every permission
  it carries is one the caller already holds), rather than hard-coding an
  "owner" slug special case.
- `AssignableRole` gained a `permissions: string[]` field, populated from the
  roles API's existing per-role permission list.

## 2026-08-31 — OTP boxes overflowing every dialog, and a real-code-scrambling bug

Found by actually clicking through the MFA enroll/disable flow in a real browser with
a real TOTP secret (computed via `django_otp.oath.totp` from the on-screen secret) --
API-level testing of the same endpoints had already passed and would never have
caught either of these, since both are pure rendering/DOM behavior.

- **The MFA enrollment dialog was unusable**: `OtpInput`'s 6 boxes rendered at
  ~193px each (containing single digits), overflowing to ~1200px wide inside a
  384px dialog and pushing the Confirm/Cancel buttons off-screen entirely.
  Root cause was one level up from the input styling: Radix's `DialogContent`
  (`src/components/ui/dialog.tsx`) is `display: grid`, and a CSS Grid item's
  default `min-width` is `auto` — the `<form>` `OtpInput` lives in is a direct
  grid-item child, so it refused to shrink to the dialog's track width and
  instead sized to its content's max-content contribution (each bare
  `<input>`'s browser-default preferred width, since flex-basis:0 doesn't
  erase that contribution for an ancestor's own intrinsic-size calculation).
  Fixed with the standard `grid-cols-[minmax(0,1fr)]` on `DialogContent` --
  systemic, so it protects every dialog in the app from this class of
  overflow, not just this one. This is why several real-browser checks
  earlier this session (share dialog, upload dialog) never surfaced it: none
  of their content was wide enough to trigger the same `min-width: auto`
  trap.
- **Retyping a wrong MFA code silently scrambled the input**: each `OtpInput`
  box had `maxLength={length}` (6, the whole code's length) instead of `1`.
  Typing into an already-filled box (exactly what a user does after seeing
  "wrong code, try again" without first clearing it) let the native input
  briefly hold 2+ characters before React's controlled re-render clamped it,
  routing every such keystroke through the multi-char/paste-redistribution
  branch and corrupting the sequence — confirmed live: typing `345122` into
  boxes still holding a previous attempt produced `300451`, not a reorder,
  genuinely different digits. Fixed to `maxLength={1}` (paste is unaffected —
  `onPaste` intercepts the clipboard event and calls `preventDefault()`
  before the browser ever inserts text natively). Also made
  `MfaEnrollDialog`'s `onSubmit` reset the form on a failed attempt, not just
  a successful one, so a user doesn't need to rely on correct overwrite
  behavior at all — retyping now always starts from empty boxes.
- Added `backendOrigins.test.ts`-style regression coverage isn't possible for
  either of these (both are real layout/DOM bugs a jsdom-based unit test
  can't observe — jsdom doesn't run layout) — the regression guard here is
  the Playwright script itself, re-run through the full enroll → wrong code →
  real code → recovery codes → disable → wrong code → real code path.

Also confirmed, once the above were fixed and testing continued: session
list/revoke, notification preference toggles, and project search/sort all
work correctly through the real UI. Two apparent failures during this pass
turned out to be test mistakes, not bugs, worth recording: (1) TOTP
anti-replay — django_otp correctly rejects a code from a timestep already
consumed, so confirming MFA and then immediately disabling with a
freshly-_computed_ (but not freshly-_windowed_) code fails by design; the
disable step must wait out a new 30s window, not just recompute. (2) Private
Project's own seeded description ("Not shared with anyone...") legitimately
contains the substring "shared", so searching "Shared" correctly returns
both projects — search matches `name` OR `description`.

## 2026-08-31 — Blob-revoke race, PDF.js SSR crash, and two CSP bugs

Found via real-browser (Playwright) and unit testing, on top of the PDF viewer work
below and this session's backend RBAC/notification fixes.

- **`useFilePreview.ts`**: the effect's cleanup revoked the blob object URL
  eagerly on every re-run (including React 18 Strict Mode's dev-only double
  mount), racing `react-pdf`'s async fetch of that same URL and surfacing as
  "Unexpected server response (0)". The previous URL is now only revoked once
  a new one replaces it, or on true unmount (tracked via a ref), not in the
  per-run cleanup.
- **PDF preview crashed the whole page during SSR** (`DOMMatrix is not
defined`): `react-pdf`/pdf.js touch browser-only APIs at import time, but
  `PdfPreview` was a plain `'use client'` component, which Next.js still
  server-renders on first pass. Extracted it into its own file
  (`PdfPreview.tsx`) and load it via `next/dynamic(..., { ssr: false })` from
  `ProjectFilesSection.tsx` so it never executes server-side. Fixes the
  blob-revoke race above too — the SSR crash was forcing a full remount into
  client rendering, retriggering it.
- **Theme flash on every page load**: next-themes injects an inline `<script>`
  to set the theme class before paint (avoiding a flash of the wrong theme).
  The CSP's `strict-dynamic script-src` requires a nonce for inline scripts,
  and `ThemeProvider` never passed one, so the browser silently blocked it on
  every load. `layout.tsx` (now `async`) reads the per-request nonce
  `proxy.ts` already forwards as the `x-nonce` header and passes it through
  `ThemeProvider`'s new `nonce` prop.
- **Sentry CSP entry was invalid syntax**: `backendConnectSrcHosts()` listed
  `'https://o*.ingest.sentry.io'` — a CSP wildcard can only replace a whole
  label, not part of one, so the browser dropped this source entirely (a
  console warning, easy to miss) and any Sentry client-side report would have
  been blocked by CSP in every environment. Changed to `'https://*.ingest.sentry.io'`
  (still covers the real `o<org-id>.ingest.sentry.io` host). Added
  `backendOrigins.test.ts` — this module had no test coverage at all before.
- **The actual reason the PDF viewer never worked, at all, in any browser**:
  `connect-src` had no `blob:` source. The three fixes above were real bugs,
  but fixing them still left every PDF preview failing with "Unexpected
  server response (0)" — `react-pdf`/pdf.js `fetch()`s the blob object URL
  created from the downloaded bytes (`useFilePreview.ts`), and a `fetch()` to
  a `blob:` URL is a `connect-src` concern, not `img-src`/`frame-src` (which
  already allowed `blob:`, left over from the old `<embed>`-based preview).
  Added `blob:` to `connect-src` in `proxy.ts`. Only caught by actually
  uploading a real PDF and watching it render — the unit tests and the
  earlier Playwright pass both stopped short of that.

Verification: `tsc --noEmit`, eslint, the new vitest file, a Playwright pass
logging in as all 4 seeded demo roles and clicking through login, project
list, project detail, the Share dialog, and a profile save (zero console
errors on any page), and — the check that actually caught the `blob:` bug —
a second Playwright pass that uploads a real, valid multi-page PDF and
verifies the viewer renders it: a `<canvas>` with real pixel dimensions, the
correct page count, Next-page navigation, and Zoom In all confirmed against
the live rendered output, not just "the page didn't crash."

## 2026-08-31 — Real PDF.js viewer for project file previews

Replaced the browser-native `<embed type="application/pdf">` in
`ProjectFilesSection.tsx`'s PDF preview branch with a `react-pdf` (`Document`/`Page`)
viewer — page navigation, a page counter, and scale-based zoom (0.5x–2.5x). Added
`src/lib/pdfWorker.ts` as a single side-effect import that points PDF.js's worker at
`public/pdf.worker.min.mjs`, a manual copy from the installed `pdfjs-dist` (a
transitive dep of `react-pdf@10.5.0`) — re-copy it by hand on any future `react-pdf`
upgrade that bumps `pdfjs-dist`. `useFilePreview.ts`'s fetch/blob-URL logic is
untouched; only how the PDF branch consumes the resulting URL changed. New locale
strings under `t.projects.files.pdf.*` and `previewLoadError`.

## 2026-08-26 — Preferences removed; Widgets → Projects with per-project access sharing

Built against the sibling backend's new contract in parallel, before its endpoints
existed in this working copy — verified via tsc/eslint/build/vitest with mocked API
responses rather than a live click-through.

- **Preferences removed entirely.** `/preferences` (page, components), the
  `PreferencesContext`/`PreferencesProvider`, its locale namespace, its nav entry
  (`ENABLED_HREFS`, `NAV_ITEMS`), its `ROUTE_PERMISSIONS` entry, and every
  `clearPreferenceSession()` call site (`axiosAuth.ts`'s refresh-failure path,
  `ProfilePopup`'s sign-out, `SessionProvider`'s cross-tab logout, `QueryProvider`'s
  401 handler) — the backend's `/api/v1/user/preferences/` endpoints are gone, so
  nothing here should still reference them. Notification preferences
  (`useNotificationPreferences`, `NotificationPreferencesPanel`) are a separate
  feature and were left untouched.
- **`widgets` replaced by `projects`** end to end: route, hooks, components,
  service, types, Zod schema, and locale namespace, copied 1:1 from the widgets
  reference implementation and adjusted for the new field set (`name`,
  `description`, `status`, `category` — `quantity` dropped along with its
  columns, form field, and cross-field "active needs stock" validation rule).
  Nav entry, `ROUTE_PERMISSIONS`, and the breadcrumb's dynamic-label resolver all
  moved from `widget` to `project`.
- **New: per-project access sharing.** The project detail page gained an Access
  section (`ProjectAccessSection` + `useProjectAccess`) listing the organization's
  members with a per-row `No access / Viewer / Editor / Manager` select, wired to
  `GET/POST/DELETE /api/v1/projects/{id}/access/`. The row list left-joins the org
  roster onto the project's grants so every member appears, defaulted to "no
  access." The hook mirrors `useOrganizationMembers`'s shape — hand-rolled
  `useCallback` actions over `useAuthMutation`, `applyApiError` + `toast` +
  `.refetch()`, never a component-level `useMutation`. The whole section is gated
  on `can('project', 'access_manage')` and renders nothing at all for a user
  without it.
- **Permission codes renamed 1:1** (`widget:*` → `project:*`) plus one new action:
  `access_manage`, independent of `manage` like `execute`/`export`/`billing`/
  `transfer` — editing a project does not imply being trusted to grant others
  access to it. `PermissionAction`, `contracts/permissions.json`, and
  `contracts.test.ts` all updated to match.
- Tests updated to stop asserting on the now-deleted `/preferences` and `/widgets`
  routes (`helper.test.ts`, `pageMeta.test.ts` now use `/organization/members`),
  and new coverage added for `useProjectAccess` (roster/grant left-join, grant,
  revoke, the `changeAccess` none-vs-level routing, pending-state clearing on
  failure) and `ProjectsTable`.

## 2026-08-26 — Social login (generic OIDC)

Fills in the commented-out SSO scaffold that used to sit in `authOptions.ts`
(lines 184-203) with a real, config-driven generic OIDC integration — not one
hard-coded provider — so enabling Google/Okta/Auth0/Azure AD is an env change on
both repos, not a code change.

NextAuth's own OIDC client does the actual authorization-code exchange with the
IdP (discovery via `wellKnown`, PKCE + state, entirely server-side); this app
never talks to the IdP for anything beyond that full-page redirect. The `signIn`
callback then hands the resulting `id_token` to the backend's new `POST
/api/v1/auth/oauth/<provider>/exchange/`, which verifies it and mints our own
token pair — the provider's own tokens never enter the session cookie, same
invariant as everywhere else in this app ("the session must carry _your_
tokens, never the provider's," per the comment this replaces).

### Added

- `src/lib/auth/oidcProviders.ts` — reads `OIDC_PROVIDERS` +
  `OIDC_<NAME>_ISSUER`/`OIDC_<NAME>_CLIENT_ID`/`OIDC_<NAME>_CLIENT_SECRET`
  (server-only) into the provider list `authOptions.ts` registers. A partially
  configured name is silently dropped rather than crashing NextAuth's request
  handler.
- `authOptions.ts` — one generic `OAuthConfig` per configured provider
  (`type: 'oauth'` with `wellKnown` + `idToken: true`, which is how next-auth
  v4 flavors an OAuth provider as OIDC). New `signIn` callback: exchanges the
  id_token with the backend, mutates `account` with the resulting session (the
  only channel from `signIn` to the `jwt` callback for the same sign-in), or
  returns a `/login/otp?challenge=...` redirect string when the resolved
  account has MFA enrolled — never creating a session in that case. The `jwt`
  callback now branches on `account.provider` so the existing credentials path
  is untouched and the new OIDC path reads from `account` instead of `user`.
- `SocialLoginButtons.tsx` — one "Continue with &lt;provider&gt;" button per
  name in `NEXT_PUBLIC_SOCIAL_PROVIDERS` (a separate, non-secret env list purely
  for which buttons render; the real provider config with its client secret
  stays server-only). Renders nothing when empty, which is the default.
- `useMfaVerifyForm.ts` now also accepts the MFA challenge via a `?challenge=`
  query param, not only from `sessionStorage` — a social-login sign-in that
  hits an MFA-enrolled account has no client-side moment to call
  `saveMfaChallenge` before the browser lands on `/login/otp` (the redirect is
  server-issued), so the hook does that hand-off itself on mount, then strips
  the query param immediately. Both `/login/otp` and `/login/backup-code` now
  wrap `MfaVerifyForm` in a `Suspense` boundary, required for the added
  `useSearchParams()` call.

### Known limitation

`authOptions.ts`'s `signIn` callback (unlike `authorize()` for the credentials
provider) has no access to the incoming request, so the real device/user-agent
forwarding the credentials flow does for the new-device-login alert and the
sessions list doesn't happen for a social-login session — it will show the
Next.js server's own values instead of the browser's. Not a security gap (the
backend's own device-fingerprint logic still runs, just against less accurate
input); worth revisiting if that display accuracy matters for a given fork.

### Verification

`src/lib/__tests__/authOptionsJwt.test.ts` — the `jwt` callback still populates
the session from the credentials path (now requires `account.provider ===
'credentials'`, matching what NextAuth actually passes) and, new, from an
OIDC `account.backendAccess`/`backendRefresh` payload the same way.
`useMfaVerifyForm.test.ts` — new test for the `?challenge=` hand-off, storing it
and stripping the query param without tripping the "no challenge, back to
/login" guard on the same render. `npx tsc --noEmit`, `next build`, and the
full `vitest` suite (248 tests) all clean.

### Follow-up — GitHub

Added right after, as a distinct provider rather than a config entry in the
generic OIDC list above: GitHub is plain OAuth2 (no id*token, no JWKS), so it's
registered via NextAuth's own `GithubProvider` (env vars `GITHUB_CLIENT_ID` /
`GITHUB_CLIENT_SECRET` — GitHub's and NextAuth's own well-known names, not the
`OIDC*<NAME>\_\*`scheme) rather than through`oidcProviders.ts`'s loop. Still
just a name in `NEXT_PUBLIC_SOCIAL_PROVIDERS`to get a button — that list
turned out not to be OIDC-specific after all, so it's renamed from`NEXT_PUBLIC_OIDC_PROVIDERS`to`NEXT_PUBLIC_SOCIAL_PROVIDERS`throughout
(docs,`.env.example`, `SocialLoginButtons.tsx`).

The `signIn` callback now branches on `account.provider === 'github'` to send
`{ access_token }` instead of `{ id_token }` to the backend's exchange
endpoint — the backend has its own matching branch
(`OAuthService.exchange_github_token`, see its own changelog) that verifies
the access_token by calling GitHub's API with it, since GitHub gives no
signed token to check offline. Everything past that point (MFA step-up,
session shape, the `jwt` callback) is identical to the generic OIDC path —
GitHub only changes which field gets sent and what the backend does with it.

---

## 2026-08-26 — MFA: code-verified disable, and a recovery-codes download option

**Security fix, paired with a backend change** (see its own changelog): the
"Disable" button on the MFA section previously turned MFA off on nothing
more than a confirm dialog — no code entry, no proof the caller still
controls the authenticator. Fixed on both ends together: the backend now
requires and verifies a code before disabling; this side had to add
somewhere for the user to actually enter one.

- **`MfaDisableDialog.tsx`** (new) replaces the plain `AlertDialog` confirm
  with a controlled `Dialog` + code input (mirrors `MfaEnrollDialog.tsx`'s
  shape). A wrong code keeps the dialog open with an inline error instead of
  closing — `AlertDialogAction`'s default auto-close behavior doesn't
  support that without fighting it, which is why this moved off
  `AlertDialog` entirely rather than layering validation onto it.
- `useMfa.ts`'s `disable()` now takes the token and returns a boolean
  (success/failure) the same way `confirmEnroll()` already does, so the new
  dialog can decide whether to close itself or show the inline error.

**Also added**: a "Download" button next to "Copy all" in the recovery-codes
reveal dialog, saving a `recovery-codes.txt` via a local `Blob` + `<a
download>` — no network round trip, since the codes already live in memory
from the confirm/regenerate response. Not `lib/downloadBlob.ts` (that helper
fetches binary from an authenticated endpoint; there's nothing to fetch
here).

### Verification

`npx tsc --noEmit`, `next build`, and the full `vitest` suite (248 tests) all
clean — no existing test called `useMfa`'s `disable()` or rendered
`MfaSection`/`MfaRecoveryCodesDialog`, so this needed no test updates, only
new coverage on the backend side (see its changelog).

---

## 2026-08-26 — Realtime push for session revocation and the notification bell

Signing out another device worked correctly (see the entry below) but relied on
`useSessions.ts`'s 10s poll to discover it — the revoked device sat on the page for
up to that long before `axiosAuth`'s 401 handler kicked in. At explicit user
request, overriding this template's own documented polling-only stance (ADR-0016),
added real push: a new `useRealtimeSocket` hook (mounted once in `LayoutWrapper`,
so it's active on every authenticated page, not only Active Sessions) opens a
WebSocket straight to the backend's new `apps.realtime` app and calls `signOut()`
the instant a `session_revoked` event arrives, and invalidates the notification
bell's queries the instant a `notification` event arrives.

**The token never reaches the browser.** `axiosAuth.ts` and `authOptions.ts`
deliberately keep the raw access token server-side only — a `WebSocket` can't
attach it as a header anyway, and putting it in a `wss://` query string would
defeat that invariant. Instead, a new same-origin route
(`src/app/api/realtime/ticket/route.ts`) reads the token from the httpOnly cookie
server-side (same mechanism as `getServerAccessToken.ts`) and exchanges it for a
short-lived, single-use, opaque ticket; only that ticket ever reaches the browser
and the `wss://` URL.

**Deliberately additive, not a replacement.** `useSessions.ts`'s 10s poll and
`useNotificationBell.ts`'s 30s poll are untouched and stay as the fail-open
backstop — a firewall blocking the websocket upgrade, or a backend channel-layer
outage, degrades back to the pre-existing polling behaviour rather than breaking
anything.

**A real correctness bug in the hook itself, caught only by testing in an actual
browser.** The first version tracked "should this effect run still act" with a
single `useRef` shared across renders. React 18 Strict Mode's dev-only
mount→cleanup→remount double-invoke resets that ref _before_ the first run's
in-flight `connect()` (paused on the ticket-fetch `await`) ever re-checked it —
so a socket from an already-"cleaned-up" effect run kept getting created and
left alive, unaffected by the real cleanup. Fixed by making the cancellation
flag a `let` local to that specific effect closure instead of a ref, which a
later, unrelated effect run cannot reach in to reset. A raw `curl`/unit-style
test would never have caught this — it only showed up watching real
`page.on('websocket')` events during manual Playwright debugging.

**`e2e/journey/sessions-signout-other.spec.ts`'s assertion tightened** from a
45s timeout (sized around the old poll interval) to 8s. Measured directly with
an instrumented Playwright run (not part of the committed suite): revoking a
session from a second device delivered `{"type": "session_revoked"}` over the
socket and had the browser on `/login` **275ms** later — confirming this is
actually socket-driven, not just an artifact of a timeout that happens to be
longer than one poll cycle. The other two journey specs run clean alongside it.

**Pre-existing, unrelated, left alone:** `src/proxy.ts`'s CSP `connect-src`
includes `'https://o*.ingest.sentry.io'`, which Chrome logs as an invalid
source expression (mid-host `*` wildcards aren't valid CSP syntax) and drops —
harmless today since Sentry isn't configured in this environment, but worth
fixing in its own change rather than folded into this one.

See the backend's `changelog/2026-08-26.md` for `apps/realtime/`'s own details
(the ticket service, the consumer, the two push sites).

## 2026-08-25 — Active Sessions: signing out _another_ device now ends it there

Follow-up to the entry below. With the current-device case fixed, signing out a
different device still did nothing on that device: the backend only blacklisted
its refresh token, and an access token is validated on signature and expiry
alone, so the revoked device kept working for up to an hour. Fixed in the
backend (cache-backed revocation set checked at authentication time — see that
repo's changelog); the frontend needed no change, because `axiosAuth`'s existing
401 handler already refreshes-then-signs-out, and the sessions list now polls, so
a revoked device discovers it within ~10s and lands on `/login` on its own.

**New spec** `e2e/journey/sessions-signout-other.spec.ts` — two real browser
contexts with distinct user agents, so they are genuinely two devices to the
backend. Signs one out from the other and asserts it is bounced to `/login`
without a reload and cannot reopen a protected page. Verified to fail without
the backend fix (the signed-out device sits on `/user-profile` for the full
45s wait) and pass with it.

**Both session specs now create their own account** through the real public
signup flow (`signUpFreshAccount` in `e2e/journey/helpers/actions.ts`) instead
of assuming a seeded login. The first version depended on a hand-made account
and broke the moment it was cleaned up — exactly the kind of hidden prerequisite
that makes a suite fail for the next person.

Run the journey project with `--workers=1`: these specs drive one shared
backend and one shared mailbox log, and running them concurrently starves them
of their own timeouts.

---

## 2026-08-25 — Active Sessions: "Sign out" did nothing, and the list was stale

Two bugs reported straight from the UI.

**"Sign out" on your own device appeared inert.** `useSessions.revoke` called the
backend and refetched the list, and stopped there. Revoking a session blacklists
its _refresh_ token; the access token in this browser's next-auth cookie stays
cryptographically valid until it expires (up to an hour), so the user carried on
browsing as if nothing had happened. It now calls
`signOut({ redirect: true, callbackUrl: '/login' })` when the revoked row is the
current one, rather than waiting for the next silent refresh to fail.

That alone was not enough, because the frontend could not reliably tell _which_
row was the current one. The backend's `is_current` flag went false for every row
once a session had rotated its refresh token — i.e. for essentially every real
session, since rotation happens hourly. Fixed in the backend (see that repo's
changelog for the full write-up of the rotation bug and its two siblings, lost
device/IP and a resetting start time); without it the branch added here could
never have fired.

**The list only updated on reload.** It was a plain one-shot query, so a session
revoked from another device stayed listed indefinitely. Now polls on a 10s
interval and refetches on window focus — polling rather than a push channel,
matching the notification spine's own deliberate stance against adding websockets
to this template.

**Also fixed:** `e2e/helpers.ts::signIn` filled the password field via a
substring `getByLabel('Password')`, which also matches the visibility-toggle
button's `aria-label="Show password"` — a strict-mode violation in shared test
infrastructure. Now passes `{ exact: true }`.

**New spec** `e2e/journey/sessions-signout.spec.ts` drives the reported scenario
in a real browser: sign in, force a refresh-token rotation through the same
`/api/auth/refresh` route `axiosAuth` uses, confirm the row still identifies
itself as "This device", sign it out, and confirm a protected page will not
reopen. Verified to fail against the unfixed backend (`toHaveCount` on the
badge: `Received: 0`) and pass against the fixed one.

246 unit tests pass, typecheck and lint clean, and the full Phase 2 journey spec
still passes.

---

## 2026-08-25 — Phase 2 auth-hardening: end-to-end Playwright journey

New `e2e/journey/phase2-auth-journey.spec.ts` — one continuous, serial
Playwright run driving a brand-new account through everything Phase 2 built:
public signup + real email OTP verification, enabling MFA (reading the
enrollment dialog's manual-entry secret and computing genuine TOTP codes —
`e2e/journey/helpers/totp.ts`, a ~50-line RFC 6238 implementation on Node's
own `crypto`, no new dependency), the login challenge (a wrong code shows an
inline error without bouncing to `/login`; a used-once backup code is
correctly refused on reuse), the self-service session list and revoke across
real independent browser contexts, the new-device login alert (and its
absence on a repeat login from the same device), and password
breach/reuse rejection on change-password. Screenshots at every milestone
land in `e2e/journey/artifacts/screenshots/`; the dedicated `journey`
Playwright project records full video + trace for every run, not just
failures (`playwright.config.ts`). See `e2e/journey/README.md` for the one
real prerequisite (the backend's console email backend — this repo has no
test mailbox, and the backend's `.env` holds real Gmail credentials) and the
one throttle-rate note (see backend changelog).

Built like a QA pass, not a script: every failure below was a real bug this
spec surfaced, not the spec being wrong to begin with, and each was root-caused
before moving on — matching this project's own "run it for real" standard.

**Backend bugs found and fixed** (full detail in the backend's own
2026-08-25 changelog): `MfaService.enroll` returned the manual-entry TOTP
secret as hex instead of base32 — invisible to every existing test, since
none of them read that string the way a person typing it into an
authenticator app would; and the IP-keyed `/login/` throttle had no
env override, so a single thorough E2E run legitimately tripped it.

**Frontend bug found and fixed**: `authOptions.ts`'s `authorize()` runs
server-side and calls the backend directly via axios — it never forwarded the
real browser's `User-Agent`/`X-Forwarded-For`, so every login the backend
ever recorded carried this Next.js server's own request signature, not the
actual signed-in device's. That silently made the new-device login alert
(Slice D) unable to ever detect a real new device in production, since NextAuth's
`authorize(credentials, req)` receives the original request but nothing was
reading it. Fixed by forwarding both headers explicitly from `req.headers`
when calling `/login/` and `/login/mfa/verify/`; `common/api/client_ip.py`'s
existing `TRUSTED_PROXY_COUNT` mechanism already covers trusting the
forwarded IP correctly, no backend change needed there.

**Two test-authoring bugs, not product bugs**, worth recording since they'd
silently produce wrong assertions in any similarly-shaped test: reading the
recovery codes' text via the dialog's flattened `textContent()` and a
`\b`-bounded regex only reliably found one of ten codes, because adjacent
`<span>` elements with no separating whitespace mean `\b` never fires between
two word characters — fixed by reading each `<span>`'s own text via
`allTextContents()` instead. And extracting the signup OTP via a bare
`\b\d{6}\b` scan over the raw email sometimes grabbed a coincidental 6-digit
substring from the message's own `Message-ID` header instead of the real
code — fixed by matching only a digit run alone on its own line, matching how
the email template actually renders it.

## 2026-08-25 — Active Sessions (device list + revoke)

Phase 2 Slice C. New "Active Sessions" card on `/user-profile`
(`SessionsSection.tsx` + `useSessions.ts` + `src/services/sessions.ts`), listing
every outstanding session for the account — device (raw `User-Agent`), IP,
and when it was created — with a per-row "Sign out" action confirmed through
the existing `ConfirmDialog` (mirroring the api-keys revoke pattern, not
`MfaSection`'s inline `AlertDialog`, since this is a list of N rows rather than
a single toggle). The row matching the request's own access token is flagged
`is_current`; revoking that one shows a stronger warning since it signs the
viewer out immediately.

Unlike the MFA section, this renders for every account regardless of
`registration_type` — a session is a JWT refresh token, not an MFA concept, so
EXTERNAL accounts have exactly as much reason to see and revoke theirs.

Backend: `GET /api/v1/auth/sessions/` / `DELETE /api/v1/auth/sessions/<jti>/`,
built on SimpleJWT's existing `OutstandingToken` table plus a new small
`SessionMetadata` side table (device/IP, keyed by JTI) — see the backend
changelog for the full design and the live-run-only bug it caught (a
migration that passed in tests but was never applied to the running dev
database).

## 2026-08-25 — Product-facing MFA (authenticator app)

The frontend counterpart to the backend's new product MFA (Phase 2 of the framework
roadmap, `apps.users.services.mfa_service`). Two pieces:

- **Login step-up, as three real routes.** `/login` (credentials) → `/login/otp` or
  `/login/backup-code` (code entry) — not one page toggling hidden component state,
  so each step has a URL that survives a reload, a bookmark, or the back button.
  `authOptions.ts`'s `authorize()` throws `MFA_REQUIRED::<challenge>` when the
  backend's `login/` response carries `mfa_required` (the only channel NextAuth's
  credentials provider has back to the client mid-flow); `useLoginForm.ts` stores the
  challenge in `sessionStorage` (`mfaChallengeStorage.ts`) and does a real
  `router.push('/login/otp')`. Both verify routes share `MfaVerifyForm.tsx` +
  `useMfaVerifyForm.ts`, submitting through a second `authorize()` branch
  (`mfaChallenge`/`mfaCode` → `login/mfa/verify/`); landing on either with no stored
  challenge redirects to `/login`. A wrong code shows an inline error and leaves the
  challenge intact for a retry; an expired challenge or a lockout (`errors.code` from
  the backend, threaded through as `MFA_RETRY::`/`MFA_FATAL::`) clears it and sends
  the user back to `/login`. See `context/auth.md`.
- **Enrollment/management.** A new "Two-Factor Authentication" section on
  `/user-profile` (`MfaSection.tsx` + `useMfa.ts`): enable (QR + manual key,
  confirm code), disable (with a confirmation dialog, since it also ends every
  other session), and regenerate recovery codes. The QR/secret and recovery codes
  follow the same reveal-once discipline as the API-keys secret dialog — held only
  in the hook's in-memory state, never cached or URL'd, since the backend
  guarantees neither is ever returned a second time. The recovery-codes dialog's
  "Copy all" checkmark resets on close and 2s after a copy, rather than sitting
  permanently checked (the dialog stays mounted; only its `open` prop toggles).

**Also fixed same day:** `/login/backup-code` showed TOTP-flavored copy for a wrong
code — the validation message said "6-digit code" for an 8-character recovery code,
and a wrong entry showed the backend's `mfa_invalid_code` wording verbatim ("check
the time on your device"), which makes no sense for a static recovery code.
`useMfaVerifyForm` now takes a `mode` and re-words that specific case per page
(`authOptions.ts` threads the error _code_, not just the message, through the
`MFA_RETRY::` prefix so the client can tell which case it is); every other error
(lockout, expired challenge, rate limit) still shows the backend's message as-is.
**That fix immediately surfaced a real backend bug**: every wrong code or expired
challenge showed a generic "Could not sign in" instead of any of the wording above,
because `errors.code` on the wire was the full message text, not the short code —
the backend's `login/mfa/verify/` endpoint had a request field literally named
`code`, which collided with and silently overwrote the envelope's reserved
`errors.code` key. Fixed backend-side (field renamed to `token`); this frontend
needed no change once that was corrected. Found only by driving the actual NextAuth
callback endpoint over HTTP — no unit test on either side read the field the way
the real client does.

**Also fixed same day:** the login flow (both the password step and MFA verify)
showed the backend's raw, untranslated 429 body on a throttle instead of the
friendly rate-limit copy every other endpoint gets via `apiError.ts`'s
`rateLimitMessage` — this path bypasses that helper entirely since NextAuth's
`authorize()` can only communicate back via a thrown `Error`'s message.
`extractEnvelopeError` now special-cases 429 the same way, countdown included.

## 2026-08-24 — Notifications: header bell, list, and preferences

New `/notifications` full list + preferences panel, plus a header bell
(unread badge, recent list, mark-read) rendered globally in `HeaderOne` — the
frontend counterpart to the backend's new notification dispatch seam
(`apps.notifications`, ADR-0016).

- **`src/services/notifications.ts`** — endpoints, query keys, and DTOs,
  mirroring `services/apiKeys.ts`'s shape. `NotificationEventType`/
  `NotificationChannel` are string-literal unions matching the backend's
  `EventType`/`Channel` enums exactly.
- **Bell** (`useNotificationBell` + `NotificationBell`) polls unread count
  every 30s always, and the recent list only while the dropdown is open — no
  websocket; see the backend ADR's realtime section for why polling is the
  deliberate choice, not a placeholder.
- **List** (`useNotificationsList` + `NotificationsView`) follows the audit
  trail's URL-backed filter/sort/pagination shape. The selector has no search
  fields server-side, so the search box is wired for toolbar consistency but
  matches nothing — a known, accepted gap rather than an oversight.
- **Preferences** (`NotificationPreferencesPanel`) renders a disabled switch
  for event types the backend's `NON_OPTIONAL_EVENT_TYPES` refuses to let a
  user turn off (password reset, signup verification) — client-side UX only;
  `NotificationService.set_preference` is the actual enforcement.
- **Route registration** is `PermissionGuard`'s `GLOBAL_PATHS`, not
  `ROUTE_PERMISSIONS` — the backend declares no `required_permissions` on any
  notifications endpoint (a notification belongs to its recipient, not a
  role), so there is no resource code for `ROUTE_PERMISSIONS` to gate on. Also
  added to `src/proxy.ts`'s `ENABLED_PREFIXES`/`matcher` and
  `src/lib/pageMeta.ts`'s `EXTRA` map (reachable only from the bell's "View
  all" link, not a sidebar entry).
- Verified live against the real backend: logged in via NextAuth credentials
  flow, confirmed unread-count → list → mark-read → count-decrements through
  the actual `/api/backend` proxy, and confirmed the preferences endpoint both
  accepts an optional opt-out and 400s a required one.

## 2026-08-24 — Organization API keys page

New `/organization/api-keys` — list, create, and revoke API keys (service
tokens) for the active organization, backed by the new `apps.apikeys` backend
module.

- **`src/services/apiKeys.ts`** — endpoints, query keys, and DTOs, following
  `services/organizations.ts`'s shape exactly. `ApiKeyCreateResponse` (the only
  shape carrying `secret`) is distinct from `ApiKeyDetail`/`ApiKeyRow`, which
  don't have that field at all — a GET can't return the secret because the type
  it deserializes into has nowhere to put it.
- **List** (`useOrganizationApiKeys` + `ApiKeysView`) mirrors the audit trail's
  URL-backed filters/pagination and the members page's local
  `pendingKeyId`/`ConfirmDialog` revoke pattern. Never cached — matches the
  backend selector's choice to treat a revoked-but-still-shown-active key as a
  security defect, not staleness.
- **Create** (`CreateApiKeyDialog`) reuses `PermissionTransferList` (the role
  editor's picker) but pre-filters its catalog to `isGrantable(code)` before the
  list ever renders — offering nothing the backend's permission-ceiling check
  would reject, rather than showing the full catalog with some entries greyed
  out.
- **Reveal-once** (`RevealSecretDialog`) — new pattern, no prior art in this
  repo. The secret lives in component state only, handed down through one prop
  chain from the mutation's resolved value; never a query key, never the
  TanStack cache, never the URL. Documented explicitly in
  `context/app/(restricted)/organization/api-keys/page.md` so a future edit
  doesn't "fix" this into a route handler (it doesn't need one — see that doc)
  or start caching the create response.
- **Route registration**: `ROUTE_PERMISSIONS` (`constants/roles.ts`, resource
  `apikey` — matches the backend's `Resource.APIKEY`), `ENABLED_HREFS` +
  `NAV_ITEMS` (`constants/navItems.ts`, new sidebar child under Organization).
  `src/proxy.ts` needed no change: `/organization` already covers the new path
  in both `ENABLED_PREFIXES` and `config.matcher`.
- `src/services/__tests__/apiKeys.test.ts` added — endpoint shape, list-URL
  param encoding, and query-key uniqueness, matching `organizations.test.ts`'s
  structure so the `src/services/**` coverage ratchet stays cleared.

---

## 2026-08-20 — Fix: "Invitations" page 404'd — wrong API prefix

The new `/invites` page (accept/decline invites in-app, added this session)
called `GET /api/v1/users/me/invites/`, but the backend route that serves it
lives in `apps.users.api.v1.urls`, which the root URL conf mounts at
`/api/v1/auth/` — matching the sibling `/api/v1/auth/me/permissions/` route,
not a `/users/` prefix. `MY_INVITES_ENDPOINT` in `services/organizations.ts`
now points at `/api/v1/auth/me/invites/`; the accept/decline endpoint builders
derive from that constant, so they were fixed by the same one-line change.

## 2026-08-20 — Self-serve organization creation had no UI at all

Real gap, found by asking "where does a user actually create an org?" — the
answer was nowhere. `OrganizationService.create()` and
`POST /api/v1/organizations/` fully worked; `CreateOrganizationPayload` and
`ORGANIZATIONS_ENDPOINT` existed in `services/organizations.ts`; an empty
`organization/new/` directory was left over from planning with no `page.tsx`
in it. Nothing in the UI ever called the endpoint.

- **`/organization/new`** — the actual page. Reachable with zero permissions:
  added to `PermissionGuard`'s `GLOBAL_PATHS`, since a permission-less,
  organization-less user has no role to be gated by yet, and this is how they
  get one. `useCreateOrganization` creates the org, then immediately calls the
  existing `switchOrganization()` — creating an org does **not** activate it
  server-side (the JWT's `org_id` claim is unchanged, same as any other
  membership change), so without the follow-up switch the user would be Owner
  of an org the token isn't acting in yet.
- **`OrganizationSwitcher` now always renders** when the user has at least one
  organization, including exactly one — previously it rendered nothing below
  two, on the reasoning that a single-org user had nothing to switch between.
  That stopped being true the moment self-serve creation became a real
  capability: "how many orgs does this user have" no longer implies "can this
  deployment have more than one." A user with zero organizations sees a bare
  "Create an organization" button instead of the dropdown; a user with one or
  more sees the usual switcher with "Create a new organization" appended.
- **The create action is always shown, not conditionally hidden** based on
  whether self-serve is enabled — the frontend has no way to know
  `ALLOW_SELF_SERVE_ORG_CREATION`/`MULTI_TENANT_ENABLED` without asking, so a
  disabled deployment surfaces the rejection as a normal field error via
  `applyApiError` on submit, the same pattern already used for the permission
  ceiling (server is the real gate, the UI mirrors it as a courtesy).
- **`/no-role` now branches on organization state.** A user with no
  organization at all was shown the same "contact an administrator" message
  as a user who has an org but no role in it — wrong advice for the first
  case, since there's no administrator to contact yet. It now shows a
  "Create an organization" button and skips the administrator-contact hint
  when `organization` is `null`.

---

## 2026-08-20 — Owner surface: pending invites, audit trail, permission inspector

Follows on from 2026-08-19's tenancy work by filling in the Owner-facing screens
its backend counterpart (`changelog/2026-08-20.md`) added endpoints for.

- **Pending invites on the members screen.** `useOrganizationMembers` now also
  queries `GET .../invites/`, and `PendingInvitesTable` lists each with a resend
  and revoke action. A seat is held from the moment an invite is sent (see the
  backend's seat-limit fix), so leaving pending invites invisible previously
  meant a full org had no way to see why it was full.
- **`/organization/audit`** — a new page and nav entry (also new: `Perm.AUDIT_VIEW`
  gating it) reading the org-scoped audit trail. Kept deliberately simple this
  pass: first page only, no filter/pager controls yet.
- **Permission inspector** — a "Why?" button on each member row opens a `Sheet`
  reading `GET /rbac/users/<id>/permissions/explain/`, listing every effective
  permission and whether it came from a role or a direct override. Reads straight
  from the backend's own resolution, so what's shown is the source that actually
  decided access, not a client-side re-derivation of the same rules.
- **Fixed: the organization nav group was invisible.** `/organization`,
  `/organization/members`, and `/organization/roles` were built and fully wired
  in `ROUTE_PERMISSIONS`/`proxy.ts`, but never added to `ENABLED_HREFS` — the
  page kill-switch — so the sidebar group never rendered for anyone, regardless
  of permissions. Found while adding the audit route to the same list.
- **`contracts/permissions.json` resynced** — the backend's new `audit:view`
  permission and `audit` resource were missing from the frontend's copy, and
  `contracts.test.ts` caught it immediately (`gates every route on a permission
the backend actually defines`), exactly the drift class this test exists for.
- **`src/services/organizations.ts`** gained endpoints/keys for invite
  detail/resend, the audit trail, and the permission-explain lookup. Role-edit
  endpoints (`organizationRoleEndpoint`/`organizationRolePermissionsEndpoint`)
  were added as builders; the page that uses them landed later the same day —
  see the entry above.

---

## 2026-08-20 — Role editor: full-page, drag-and-drop permissions, system roles now editable

Follow-up within the same day, matching the backend's system-role-editing change
(`changelog/2026-08-20.md`). The old role screen only supported creating a
custom role, via a flat checkbox grid in a dialog — no way to edit an existing
role of any kind, custom or system.

- **`PermissionTransferList`** (`components/common/`) — a dual-panel picker:
  drag a permission between "Available" and "Granted", grouped by resource,
  searchable. Drag is a shortcut, not the only path — every row also has a
  click-to-move arrow button, since drag-and-drop alone is unusable by keyboard
  or screen-reader users. Locked (non-grantable) permissions render disabled
  and undraggable, mirroring the backend's ceiling rule.
- **Two new routes, not a drawer.** `/organization/roles/new` and
  `/organization/roles/[roleId]` — a first pass put the editor in a `Sheet`,
  but a two-panel permission picker with search and a couple hundred rows
  wants the width a side panel doesn't have, and an editor worth deep-linking,
  bookmarking, or sharing shouldn't only exist as transient dialog state.
  `RoleEditorForm` is the one shared form both routes render; `RolesView`'s
  cards are now links instead of buttons that opened the drawer.
- **System roles are directly editable**, not just custom ones — matching the
  backend. They show a "Reset to defaults" action instead of delete; custom
  roles show delete instead of reset.
- **`useOrganizationRoles`** (list) and the new **`useRoleDetail`** (one role:
  `save`, `reset`, `remove`) replace the single do-everything hook from the
  drawer version — the list and the editor now have independent data
  lifecycles, so navigating between roles can't leave a half-edited permission
  set attached to the wrong role. `usePermissionCatalog` factors out the
  catalog fetch + ceiling check both hooks need.
- **`RestrictedBreadcrumb`** gained a `roles` resolver, so
  `/organization/roles/<uuid>` shows the role's name instead of a raw id —
  the same pattern the widgets detail route already used.
- **`services/organizations.ts`**: `organizationRoleEndpoint`/`organizationRoleKey`
  renamed to `roleDetailEndpoint`/`roleDetailKey` (single-arg — no organization
  id, since the endpoint is tenant-scoped by the request's own JWT claim, not
  by a path segment), matching the `widgetDetailEndpoint`/`widgetDetailKey`
  convention the breadcrumb resolver contract expects.
- New backend endpoint wired in: `organizationRoleResetEndpoint` →
  `POST /rbac/roles/<id>/reset/`.

---

## 2026-08-19 — Multi-tenancy: the session now carries an organization

The backend became multi-tenant at the schema level (see the backend's
`changelog/2026-08-19.md`). Every permission is now resolved **within** an
organization, so the frontend has to know which one the session is acting in.

The key constraint shaping all of this: the active organization is a **signed claim
inside the JWT**, not a header or a client-held value. Nothing in the browser can
change which tenant a request is answered for — switching has to go to the backend
for a new token pair.

- **`session.user.organization` / `.organizations`** — the active organization plus
  every one the user may switch to. Present in _both_ tenancy modes: a single-tenant
  deployment carries exactly one entry and the UI hides the switcher, which is what
  keeps the two modes on one code path instead of two. Display only; the token is the
  authority.
- **`OrganizationContext`** (`app/(restricted)/context/`) — seeded server-side in the
  restricted layout alongside `PermissionsProvider`. `switchOrganization()` calls
  `POST /api/v1/organizations/{id}/switch/`, writes the returned token pair into the
  JWT cookie via `useSession().update(...)`, and then **clears the TanStack Query
  cache** — every cached query was keyed without an organization dimension, so
  keeping it would render the previous tenant's data under the new tenant's name.
- **`src/services/organizations.ts`** — endpoints and query keys for organizations,
  members, invites, and custom roles. Detail/member/role keys include the
  organization id, for the same cache-collision reason.
- **`src/lib/helper.ts`** — `PermissionAction` gained `billing` and `transfer`, and
  neither is added to `MANAGE_IMPLIED`. They are exactly what separates an
  organization's Owner from its Admin: if `manage` implied them, every admin would
  silently be an owner. `contracts.test.ts` asserts this against the backend's
  generated contract, and caught the drift when the actions were first added.
- **`src/app/api/backend/[...path]/route.ts` is unchanged, deliberately.** No
  `X-Organization-Id` header was added — a client-supplied header would make the
  tenant attacker-controlled and force every endpoint to re-verify it. The
  organization rides inside the token the proxy already attaches.

- **Org switcher** (`components/sidebar/OrganizationSwitcher.tsx`) — renders
  **nothing** when the user belongs to a single organization, which is every user of
  a single-tenant deployment. That is the whole single-tenant UI story: no flag
  check, no alternate layout, just a component with nothing to offer.
- **Management screens** under `(restricted)/organization/` — settings (with a
  danger zone), members (invite, change role, remove), and a custom-role builder
  that renders from the backend's permission catalog. The builder greys out codes
  the current user does not hold, mirroring the server's ceiling rule — a courtesy,
  not the control, since the service rejects an out-of-ceiling code regardless.
- **Route wiring** touched all four lists that must stay in sync:
  `ROUTE_PERMISSIONS`, `ENABLED_HREFS` + `NAV_ITEMS`, and `ENABLED_PREFIXES` +
  `config.matcher`. The two child routes precede the parent in `ROUTE_PERMISSIONS`,
  since it resolves by longest prefix — otherwise `/organization/members` would be
  gated on `organization` rather than `member`, locking out a member-manager who
  lacks `organization:view`.

## 2026-08-19 — Backend calls proxied through Next.js; access token no longer client-readable

Security-audit fix: the access token was previously exposed via `session.accessToken`
(readable by any script via `useSession()`/`getSession()`/`GET /api/auth/session`),
so an XSS bug anywhere in the app or its dependency tree was a full, reusable
backend-credential theft. Fixed architecturally, not by mitigation alone:

- **New same-origin proxy** — `src/app/api/backend/[...path]/route.ts` forwards
  every method/path/query/body to the backend and attaches the access token
  server-side (read from the encrypted JWT cookie via `getToken()`). A generic
  pass-through, not a per-endpoint allowlist.
- **`axiosAuth.ts`** now points at `/api/backend` instead of the backend origin and
  never attaches `Authorization` itself — the 401 → refresh → retry flow is
  unchanged in shape, just simpler (no client-held token to cache/clear).
- **`authOptions.ts`'s `session()` callback** no longer puts `accessToken` on the
  session object at all — removed from `types/next-auth.d.ts`'s `Session` interface
  too. Server-only code that needs the raw token now reads it via the new
  `src/lib/auth/getServerAccessToken.ts` (Server Components) or `getToken()`
  directly (Route Handlers), never via `session.accessToken`.
- **`/api/auth/refresh/route.ts`** no longer returns the new access token in its
  response body (`{ refreshed: true }` instead of `{ access }`) — nothing client-side
  needs it anymore, since retrying through the proxy picks up the rotated token
  automatically from the cookie.
- Also set `skipTrailingSlashRedirect: true` in `next.config.ts`: Next's default
  trailing-slash redirect was firing on every single proxied call (every backend
  endpoint is slash-terminated), adding a wasted round trip; the proxy route
  already normalizes the trailing slash itself before forwarding to Django.
- `axiosPublic.ts` is unchanged (still calls the backend origin directly) — it never
  carries a token, so there's nothing to proxy.

See `context/auth.md` and `context/api.md` for the updated architecture description.

## 2026-08-06 — Public self-signup

Added `/signup/create`, an open self-registration flow alongside (not replacing) the
existing invite-only `/signup`. See `context/app/(public)/signup/create/page.md` for
the flow detail; the backend gates it behind `PUBLIC_SIGNUP_ENABLED` (opt-in, off by
default), so the frontend route exists unconditionally but only works once an
operator flips that flag.

- **Two-step form** (`usePublicSignupForm`): details → emailed OTP → account
  activates and the hook signs the user in through the normal `signIn('credentials')`
  path, same convention the invite flow (`useSignupForm`) already uses, rather than
  hand-rolling a session from the verify response.
- **Login page** now links to the new route (`Don't have an account? Sign up`).
- `src/proxy.ts`'s route matcher gained `/signup/:path*` — `/signup` alone doesn't
  match a sub-path.

## 2026-08-02 — Template initialized

Extracted from two production applications that had diverged from a common ancestor,
by copying and subtracting rather than rewriting — which preserves the details a
rewrite silently drops (the cookie chunk size, the single-flight refresh queue,
version-bump cache invalidation).

- **Domain removed.** All product-specific routes, services, types, and locale
  namespaces deleted. `widgets` added as the one worked example, removable with
  `npm run strip-demo`.
- **One component library.** `@base-ui/react` removed; direct `radix-ui` imports
  banned by lint. shadcn/ui only, on the stock neutral theme with no brand palette
  (ADR-0014), so every primitive added later matches automatically.
- **i18n enforced, not requested.** English-only typed catalog; `Translations` derived
  from `typeof en` so adding a language is content-only and a missing key is a compile
  error. The hardcoded-string lint rule was promoted from warning to error and
  extended to `placeholder`, `title`, `alt`, `aria-label`, and `toast.*()` — which
  immediately caught five untranslated accessible labels.
- **Contract drift caught in CI.** `contracts/*.json` is generated by the backend and
  asserted in `src/__tests__/contracts.test.ts`. Two historical drifts motivated it:
  a `limit` → `page_size` rename that silently reverted every list to its default page
  size, and a filter-config field mismatch that rendered blank filter headings. Both
  type-checked cleanly on each side.
- **Dead code removed.** A second unused login implementation, a "remember me"
  checkbox wired to nothing, a `TogglePill` bound to a deleted preference design, and
  an SSO provider calling a backend endpoint that no longer exists.
- **Gates.** tsc, ESLint at `--max-warnings 0`, Prettier, Vitest with directory
  coverage ratchets, production build, and the bundle budget — all green, all repeated
  unbypassably in CI.
