# QA Test Plan — Enterprise Starter (Frontend + Backend)

Full feature inventory for manual QA. Organized by area; each feature lists what
to test, expected behavior, and edge cases worth trying. Roles referenced: **Owner**,
**Admin**, **Member**, **Read Only** (seeded demo roles — see "Test accounts" below).

## Test accounts

Seeded via `manage.py seed_demo_users` (DEBUG only), two organizations, password
`Demo@12345` for all:

| Org                     | Owner                  | Admin                  | Member                  | Read Only                 |
| ----------------------- | ---------------------- | ---------------------- | ----------------------- | ------------------------- |
| Demo Org (`demo-org`)   | demo.owner@example.com | demo.admin@example.com | demo.member@example.com | demo.readonly@example.com |
| Acme Corp (`acme-corp`) | acme.owner@example.com | acme.admin@example.com | acme.member@example.com | acme.readonly@example.com |

Each org gets two seeded projects: "Shared Project" (Member has editor access) and
"Private Project" (Member has no access).

Use the two orgs to verify **cross-tenant isolation**: nothing seen/done as a Demo
Org user should ever be visible or actionable from an Acme Corp session, and vice
versa (same email domain pattern, different org — an easy place for a filter to be
missing).

---

## 1. Authentication

### 1.1 Login (`/login`)

- Valid email + password → redirects to dashboard.
- Wrong password → inline error, no redirect, password field does not clear (or does — check actual UX), no account lockout info leaked (don't reveal "user exists" vs "wrong password").
- Non-existent email → same generic error as wrong password (no email enumeration).
- Empty fields → client-side validation blocks submit before any request.
- 5 failed attempts within a short window → rate-limited (429 / "too many attempts") — this is `AUTH` scope throttling, 5/min per IP by default. Confirm the UI shows a sane message, not a raw error.
- "Forgot password?" link → goes to `/forgot-password`.
- Social login buttons (`SocialLoginButtons.tsx`) — if enabled, confirm each provider button initiates its OAuth flow and returns a logged-in session on success.
- Successful login for a user with MFA enabled → redirects to `/login/otp`, NOT straight to dashboard.

### 1.2 MFA verification (`/login/otp`)

- Segmented 6-box code input: type a valid TOTP code → auto-advances per digit, submits (auto or via button) → redirects to dashboard.
- Wrong code → inline error, boxes should be clearable for retry (recently fixed bug: retyping into pre-filled boxes without clearing first used to scramble the digits — verify a wrong-code retry produces the code you actually typed).
- Paste a full 6-digit code into any box → splits across all boxes correctly, cursor lands in the last box.
- Backspace on an empty box moves focus to the previous box and clears it.
- Arrow left/right move focus between boxes without altering values.
- Code reuse: the _same_ correct code submitted twice in a row within the same 30s window should be rejected the second time (TOTP anti-replay) — this is correct security behavior, not a bug; don't file it as one.
- Repeated wrong codes → account MFA-locks after the configured threshold (`MFA_FAILURE_LIMIT`); confirm the UI surfaces a clear "too many attempts" message distinct from "wrong code."
- "Use a backup code instead" link → goes to `/login/backup-code`.

### 1.3 Backup code login (`/login/backup-code`)

- Plain text input (not segmented — codes are alphanumeric with a dash, this is correct, not a missed OTP-box conversion).
- Valid unused backup code → logs in successfully.
- Reused backup code → rejected (single-use).
- Each successful backup-code login should reduce the visible "remaining codes" count if that's surfaced anywhere in profile/security.

### 1.4 Signup (`/signup`, `/signup/create`)

- New email + valid password → account created, org creation or invite-acceptance flow follows depending on whether this is a fresh org signup or joining via invite link.
- Duplicate email → clear error, no account enumeration beyond what's necessary.
- Password policy: too short / missing complexity → inline validation error naming what's missing.
- Password confirmation mismatch (if a confirm field exists) → inline error.

### 1.5 Forgot password (`/forgot-password`)

- Submit a known email → generic "check your email" confirmation regardless of whether the email exists (no enumeration).
- Reset link (from actual email/backend) → lands on a set-new-password form, old sessions should be invalidated after reset (verify by checking an old session token stops working).
- Expired/already-used reset link → clear error, no crash.

### 1.6 Login/signup shell layout

- Left branding panel + right form panel on desktop; collapses to single centered card on mobile/narrow viewport. Same shell wraps login, signup, forgot-password, and both MFA pages — check all five render correctly at both breakpoints.

---

## 2. User Profile (`/user-profile`)

Organized as tabs: **Profile**, **Security**, **Sessions**.

### 2.1 Profile tab

- Personal info form: edit first/last name → save → success toast, values persist on reload.
- Partial edit (change only last name, leave first name untouched) → does not blank out first name (this was a real backend bug, now fixed — worth a regression check).
- Avatar/hero display, if present, reflects updated name immediately without full page reload.

### 2.2 Security tab

- **Change password**: correct current password + valid new password → success, old password stops working, new one logs in.
  - Wrong current password → inline error, no change applied.
  - New password fails policy → inline validation.
  - New password same as old → check whether this is blocked or allowed (confirm intended behavior).
- **MFA section**:
  - Enroll: shows QR code (image) + manual-entry secret text (select-all, copyable). Confirm the raw secret is only ever shown once — reopening enrollment (if not yet confirmed) or viewing the section after enrollment completes should never re-display the same secret.
  - Confirm enrollment with a valid TOTP code → success, MFA now shows as "enabled," recovery codes dialog appears.
  - Confirm with wrong code → inline error, boxes clear for retry (see 1.2's OTP-box regression note — applies here too).
  - Cancel mid-enrollment (close dialog / click outside — note the dialog blocks outside-click dismissal deliberately, confirm that's still true) → no partial MFA state left enabled.
  - Recovery codes dialog: codes are shown once, copyable; closing and reopening MFA settings should not re-reveal them.
  - Disable MFA: requires a valid code (TOTP or recovery) to confirm disabling. Wrong code → error. After disabling, login no longer prompts for OTP.
- **MFA account lockout**: several wrong disable/verify attempts in a row → locks MFA-related attempts temporarily; distinguish this from "wrong code" in the UI copy.

### 2.3 Sessions tab

- Lists active sessions (device/browser/IP/last-active, whatever fields are shown).
- "Revoke" on a session other than the current one → that session's token stops working immediately (verify with a second logged-in browser/incognito window).
- Revoking the _current_ session (if allowed) → logs the current user out.
- "Revoke all other sessions" (if present) → every session except current one dies.

---

## 3. Organization Settings (`/organization`)

- View org name/details. Owner/Admin can edit; Member/Read Only see it read-only or the page/edit controls are hidden.
- Save changes → success toast, persists on reload.
- Org deletion / ownership transfer / billing controls (if present) are **Owner-only** — Admin should not see or be able to trigger them (backend: `ORGANIZATION_DELETE`, `ORGANIZATION_BILLING`, `ORGANIZATION_TRANSFER` are excluded from Admin's grant on purpose).
- Create a brand-new organization (`/organization/new`) from a fresh signup or via an "add organization" entry point, if reachable from the UI — confirm the creator becomes Owner of the new org.

## 4. Members (`/organization/members`)

- **Members table**: lists all org members with role, status. Owner/Admin see management actions; Member/Read Only should not.
- **Invite member** (dialog): enter email + role → invite created, appears in "Pending invites" table with correct role.
  - Invite an email already a member → clear error, no duplicate.
  - Invite an email with a pending invite already → resending should replace/void the old invite id, not create two live invites (confirmed backend behavior — check the UI reflects only one pending row after a "resend").
  - Role dropdown only offers roles the _inviter_ is allowed to assign (an Admin shouldn't be able to invite someone as Owner, for example — verify the ceiling rule).
- **Pending invites table**: revoke a pending invite → disappears from the list, the invite link/token stops working.
- **Member detail / role change**: change a member's role → takes effect immediately (their next request is evaluated under the new role — test by having that user reload/act right after).
- **Permission inspector sheet**: opens a view showing exactly which permissions a given member effectively has (base role + any overrides). Cross-check displayed permissions against actual behavior (e.g., if it says they lack `project:delete`, confirm the delete action is actually blocked for them).
- **Member overrides** (`/organization/members/[userId]/overrides`): grant/revoke individual permission overrides on top of a member's role.
  - Add an override → permission inspector and actual API access reflect it.
  - Remove an override → reverts to the base role's grants.
  - Ceiling rule: even via overrides, a non-Owner should not be grantable owner-only permissions (billing/transfer/org-delete) — verify this is enforced, not just hidden in the UI.
- **Remove a member from the org** → they lose access immediately; their sessions should stop working for this org (check for a multi-org user whether it affects only this org's access).

## 5. Roles (`/organization/roles`)

- **Roles list**: shows built-in roles (Owner, Admin, Member, Read Only) and any custom roles.
- **Create custom role** (`/organization/roles/new`): name it, pick a permission set → appears in the roles list, assignable to a member via the Members page.
  - Attempt to grant an owner-only permission (billing/transfer/org-delete) to a custom role as a non-Owner creator → blocked (ceiling rule).
- **Role detail / edit** (`/organization/roles/[roleId]`): view and edit an existing custom role's permission set. Built-in roles should not be editable/deletable.
- **Delete a custom role** currently assigned to a member → verify the product's intended behavior (block deletion with a clear error, or reassign/orphan members — check which and confirm it matches; don't assume either without checking).

## 6. API Keys (`/organization/api-keys`)

- **List view**: shows existing keys (name, created date, last-used, masked value — never the raw secret after initial creation).
- **Create dialog**: name a new key → creates it, shows the **raw secret exactly once** in a "reveal" dialog with a copy button; closing/reopening should never show the raw value again (only the masked form in the list).
- Revoke/delete a key → it disappears from the list and immediately stops authenticating API requests made with it (test with a real `curl` call using the old key after revocation).
- Read Only / Member without `apikey:manage` → cannot see the create button or revoke action (verify both the UI gating and that a direct API call is also rejected server-side, not just hidden client-side).

## 7. Audit Log (`/organization/audit`)

- Read-only list of org activity (logins, member changes, role changes, key creation, project changes, etc. — whatever the app actually logs).
- **Detail sheet**: click a row → shows full details (actor, timestamp, before/after or payload).
- Filter/search/sort controls, if present, behave as labeled (check actual param names via network tab — this codebase uses `filter`+`filter_by`, `search`+`search_by`, `sort`+`sort_direction` conventions, not generic single-param filters).
- Confirm no write actions exist anywhere on this page — audit is append-only by design.
- Confirm entries logged in Demo Org never appear when viewing audit as an Acme Corp user (cross-tenant isolation).

## 8. Invites (`/invites`)

- "My invites" view: a user who has been invited to another org sees it listed here (distinct from the per-org "Pending invites" table in Members, which is the _inviter's_ view).
- Accept an invite → joins that org with the assigned role, org becomes selectable/switchable.
- Decline/ignore an invite → it's removed from the list, doesn't grant access.
- An expired invite → clearly marked or already gone, cannot be accepted.

## 9. Notifications (`/notifications`)

- **Notifications view**: list of received notifications (read/unread state, if tracked).
- **Notification preferences panel**: toggle a specific `{event_type, channel}` pair on/off → persists (reload the page to confirm), and actually affects whether that notification is sent/shown going forward (hard to verify without triggering the underlying event — at minimum confirm the toggle state persists correctly per event/channel combination, since the API takes one triple at a time, not a bulk object).

## 10. Admin — Impersonation (`/admin/impersonation`)

_(Likely Owner/Admin-only or platform-admin-only — confirm the actual gate.)_

- **Start impersonation form**: pick a target user → begin impersonating; UI should clearly indicate "you are impersonating X" (banner or similar) for the whole duration.
- Actions taken while impersonating should be attributable to the impersonated user in the audit log, while also recording who the real actor was (impersonation should never be untraceable).
- **Sessions table** here: distinct from the profile's own Sessions tab — likely shows sessions across users/org for admin oversight. Confirm it doesn't leak other orgs' sessions.
- End impersonation → returns to the real admin identity cleanly, no lingering impersonated-state artifacts.

## 11. No-role state (`/no-role`)

- A user who is authenticated but has no active role assignment in the current org lands here instead of the dashboard.
- Page should explain the state and offer a way out (switch org, contact admin, accept a pending invite) rather than a dead end.

## 12. Dashboard (`/dashboard`)

- Landing page after login. Confirm it loads without error for every role (Owner/Admin/Member/Read Only) and shows role-appropriate content/widgets.

---

## 13. Projects

### 13.1 Projects list (`/projects`)

- Grid/List/Table view toggle (if present) — all three should show the same underlying data consistently.
- Shows only projects the current user has access to: Owner/Admin see all org projects; Member/Read Only see only projects they've been granted access to (verify "Private Project" from the seed data is invisible to a Member who wasn't granted access, but visible to Owner/Admin).
- **Search**: matches against project name AND description (a project whose _description_ contains the search term will legitimately match — this is correct substring behavior, not a bug).
- **Filter** / **Sort** controls — verify actual result ordering/filtering matches the selected option.
- **Create project dialog**: name + description → appears in the list immediately. Member (with `project:create`) can do this; Read Only cannot (button hidden, and a direct API call should also 403).

### 13.2 Project detail (`/projects/[projectId]`)

- **Access section / Share dialog**: opens as a popup (not inline). Shows current people with access + their access level (viewer/editor/owner or whatever levels exist).
  - Grant access to another org member → appears in the list with correct level immediately.
  - **Cross-org grant attempt**: try (via direct API call, since the UI shouldn't offer this) to grant access to a user from a _different_ organization — must be rejected (404/403), even though this looks like a plain user-id lookup at a glance. This was a real fixed vulnerability — worth a permanent regression check each release.
  - Change an existing grantee's access level → takes effect immediately (test by having that user reload).
  - Revoke access → that user immediately loses visibility into the project (test with their own session).
  - Only users with `project:access_manage` (Owner/Admin, or a Member explicitly granted this) can open/use the Share dialog — confirm it's hidden entirely otherwise, not just disabled.
- **Edit / delete project**: Member with `project:update` can edit but should get a hidden button and a 403 on `project:delete` (Member doesn't have delete). Read Only gets 403/hidden on both. Owner/Admin unaffected on both.

### 13.3 Files (within project detail — `ProjectFilesSection`)

- **Upload**: drag-drop and/or file picker → appears in the file list with correct name/size/type.
  - Upload an unsupported/oversized file (if there are limits) → clear rejection message, not a silent failure or crash.
- **Rename** a file → new name persists, doesn't affect the underlying stored content or break an in-progress preview.
- **Delete** a file → removed from the list and no longer downloadable/previewable (verify the direct download/preview URL 404s afterward, not just that it's hidden from the list).
- **Preview**:
  - **Images**: render inline directly.
  - **PDFs**: render via the real PDF.js-based viewer — page navigation (prev/next/page counter) and zoom in/out both work; opening a multi-page PDF and navigating to the last page renders correctly; this depends on the CSP allowing `blob:` fetches — if the viewer ever regresses to a blank/error state, check `connect-src` in the CSP first, that's the historical root cause.
  - **Other file types**: fall back to a download-only affordance (no broken embed/preview attempt).
- File-list permissions mirror project permissions: Read Only can view/download/preview but not upload/rename/delete.

---

## 14. Cross-cutting concerns to spot-check throughout

- **Cross-tenant isolation**: for every list/detail page above, confirm a Demo Org session never sees Acme Corp data and vice versa — this product has no DB-level row-level security, so isolation depends entirely on each view correctly filtering by organization. Treat any leak here as a P0.
- **Permission gating is enforced server-side, not just hidden client-side**: for any action gated by role (delete project, manage API keys, edit org, etc.), confirm a direct API call (browser devtools / curl) from a lower-privileged account is rejected (403/404), not just that the button is hidden in the UI.
- **Session/token expiry**: an expired or revoked session should redirect to login cleanly on the next action, not show a broken/blank page.
- **Rate limiting on auth endpoints**: repeated rapid login/MFA attempts should throttle gracefully with a clear message, not a raw 500 or silent hang.
- **Toasts/error messages**: every mutation (create/update/delete across every feature above) should show a success or error toast — flag any silent failure (action appears to do nothing, no confirmation either way).
- **Empty states**: every list (projects, members, invites, API keys, notifications, sessions, audit log) should render a sensible empty state for a brand-new org/user, not a blank page or a crash.
- **Responsive layout**: spot-check the login/signup split-screen shell, all dialogs (Share, Create Project, Invite Member, Create API Key, MFA enroll), and the profile tabs at a narrow mobile viewport — the OTP boxes and dialog content have previously overflowed their containers at certain widths.
