# Organization Settings

**Source:** `src/app/(restricted)/organization/page.tsx`

Rename/delete the active organization, transfer ownership, and (read-only) view its
plan tier and seat limit.

## File map

```
src/app/(restricted)/organization/
  page.tsx                              # Server: metadata + renders OrganizationSettingsView
  components/
    OrganizationSettingsView.tsx        # Orchestrates form + danger zone + plan/seats
  hooks/
    useOrganizationSettingsForm.ts      # Rename + delete mutations
    useOrganizationPlan.ts              # Read-only plan tier + seat limit fetch
    useTransferOwnershipForm.ts         # Ownership transfer

src/services/organizations.ts           # Endpoints, query keys, OrganizationDetail type
```

## Plan tier and seat limit are read-only, fetched separately

`useOrganizationSettingsForm` gets `organization` (`{id, name, slug}`) from
`OrganizationContext`, which is session-derived and never carries `plan_tier` or
`seat_limit` — those only exist on the full `GET /organizations/{id}/` response
(`OrganizationDetail`). `useOrganizationPlan` fetches that separately via
`organizationDetailKey`/`organizationDetailEndpoint`, rather than folding it into
the settings-form hook, because it is display-only: there is no self-serve billing,
and `plan_tier` is an operator decision made in the Django admin (see the backend's
`OrganizationAdmin.save_model`, which audits changes to it). A `null` plan tier
renders as "No plan assigned"; a `null` seat limit renders as "Unlimited" — both mean
the organization is currently unmetered on that dimension, not that the field failed
to load.

## Settings tabs (Sprint-1 gap closure)

`OrganizationSettingsView` now wraps its content in `Tabs`: the existing
rename/danger-zone content moved unchanged into a "General" tab; seven other
tabs each own one settings resource, resolved against the session tenant
(`/api/v1/settings/{organization,brand,profile,features,domains,ai-preferences,security}/`
— no organization id in the URL, unlike every other endpoint on this page).
The `TabsList` scrolls horizontally: eight tabs no longer fit a narrow
viewport, and wrapping them would push the panel below the fold on mobile.

- **Brand** (`BrandSettingsTab`/`useBrandSettingsForm.ts`): logo and favicon
  URLs, primary and secondary colors (client-validated hex, mirroring the
  backend's `_validate_hex`), tone of voice, company description, plus a
  white-label group added 2026-09-06 (`display_name`, `email_from_name`,
  `email_reply_to`). `display_name` is deliberately a _branding_ field rather
  than an edit to the General tab's `name`: the backend keeps them separate so
  rebranding a tenant's public-facing name never touches its slug or anything
  derived from the original name.
- **Profile** (`OrganizationProfileTab`/`useOrganizationProfileForm.ts`):
  contact and business details (legal name, website, contact email/phone,
  address). Split from Brand on the backend because it is company information
  with no bearing on rendering, and because the two are expected to diverge on
  who may edit them.
- **Features** (`FeatureFlagsTab`/`useFeatureFlagsForm.ts`): three switches
  over `Organization.settings["features"]`. The backend enforces an allowlist
  (`FEATURE_FLAG_KEYS`), so adding a flag is a two-sided change: an unknown
  key is rejected outright. Its errors arrive as `non_field_errors`, which has
  no field to bind to, so `applyApiError` toasts them.
- **Domains** (`DomainsTab`/`useOrganizationDomains.ts`): claim, verify,
  promote, and remove custom domains. **This is data-model groundwork on the
  backend** — nothing routes on these rows, there is no TLS provisioning, and
  `verify` flips a flag without performing a DNS lookup. The tab says so
  rather than implying a working custom-domain feature. Verification tokens
  are shown only while a domain is unverified, since republishing the record
  after the fact changes nothing. Client-side shape validation
  (`organizationDomainSchema` in `src/lib/schemas/settings.ts`) goes through
  the shared `isValidHostname()` in `src/lib/hostname.ts` (backend
  2026-09-07 extracted the equivalent `common/net/hostname.py` from what had
  been two independently-drifted regexes) — it now requires an
  alphabetic-only TLD, tighter than before, so e.g. `example.123` is
  rejected client-side, not just server-side. The same helper backs
  `agentDomainCreateSchema` (see
  `context/app/(restricted)/agents/[agentTypeSlug]/settings/page.md`), with
  `localhost` allowed there only, for local widget testing.
- **AI preferences** (`AiPreferencesTab`/`useAiPreferencesForm.ts`): three
  switches — require approval before outreach/publishing, allow
  auto-CRM-updates.
- **Security** (`SecuritySettingsTab`/`useSecuritySettingsForm.ts`): require
  2FA, log all agent actions.
- **Data** (`DataSettingsTab`/`useOrganizationDataSettings.ts`): export
  history + request (`GET`/`POST /api/v1/settings/data/export/`) and delete
  (`POST .../data/delete/` emails a confirmation link).

### The bootstrap endpoint prefetches, but never replaces, the per-tab reads (2026-09-09)

`GET /api/v1/settings/bootstrap/` returns every tab except Domains in one
response. `useOrganizationSettingsBootstrap(organizationId)` (called once from
`OrganizationSettingsView`, regardless of which tab is active) fetches it and
seeds each tab's own query cache — `SETTINGS_BRAND_KEY`, `SETTINGS_PROFILE_KEY`,
`SETTINGS_FEATURES_KEY`, `SETTINGS_AI_PREFERENCES_KEY`, `SETTINGS_SECURITY_KEY`,
plus `organizationDetailKey` (the same cache `useOrganizationPlan` reads for
plan tier/seat limit) — via `queryClient.setQueryData`, only when that key has
no entry yet (`existing ?? …`), so it never clobbers a fresher value a tab's
own `PATCH`/refetch already wrote.

Each tab's own hook is otherwise untouched: it still reads and writes through
its own endpoint and key, and still invalidates only that one key on save.
Radix `Tabs.Content` unmounts inactive panels by default, so before this
change opening Settings fired one request per tab as each was clicked; now
the bootstrap call fires once on mount and every tab after the first renders
from cache with no additional round trip. Domains stays a separate,
un-prefetched fetch — the bootstrap response deliberately excludes it.

All of these gate their editable controls on `organization:manage`, matching
the General tab's existing convention; Data's export/delete actions gate on the
more specific `organization:export`/`organization:delete` instead, since
they're independently-granted codes (see `AGENTS.md`'s `MANAGE_IMPLIED` note).

Three details in the Data tab are load-bearing rather than incidental:

- The export-history **read** is gated on `organization:export` via the
  query's own `enabled`, not just its section's visibility. The backend gates
  `OrgDataExportListCreateView`'s GET on that same code, so firing it
  unconditionally 403'd on every render for the ordinary member who can open
  this page but not export it.
- Downloads go through `src/lib/downloadBlob.ts`, not a hand-rolled object
  URL: it honours the server's `Content-Disposition` filename and, more
  importantly, parses the error Blob back into the standard envelope so
  `applyApiError` can surface the real message. The 404 an export that isn't
  `ready` returns is exactly that case, and without it the user gets a
  generic failure.
- A member holding only `organization:view` sees neither section, so the tab
  renders an explicit "no access" line instead of an unexplained blank body.

Each of the other three tabs renders `SettingsTabError` (a small shared
component) when its GET fails, rather than falling through to an empty form —
saving that form would overwrite real settings with blanks. Their `form.reset`
calls also pick the editable fields explicitly: every settings serializer also
returns a read-only `id`/`updated_at`, and spreading the response would park
those in form state and PATCH them straight back on every save.

`/organization/data-delete-confirm` (`DataDeleteConfirmView`) is a separate
page because the link is opened from an email, outside this session's normal
navigation. It reads `?token=` with `useSearchParams` (hence the `Suspense`
boundary in its `page.tsx` — Next requires one), explains itself rather than
showing a permanently disabled button when the token is missing, and on
success navigates to `DEFAULT_LANDING` and calls `router.refresh()`: the
session's active organization has just been deleted, so the restricted layout
must re-read the session rather than keep trusting the stale client copy —
the same move `useOrganizationSettingsForm.deleteOrganization` already makes.

## Member suspend/reactivate (Sprint-1 gap closure)

`/organization/members` (`MembersTable.tsx`/`useOrganizationMembers.ts`) gains
a status column and a suspend/reactivate icon button, gated `member:manage`:
`POST .../members/{userId}/suspend/` and `.../reactivate/`.
`OrganizationMember` gained `status: 'active'|'suspended'` and
`suspended_at`; the member list now includes suspended members (previously
implicitly excluded) — suspended is distinct from removed, so the row stays
visible with its role intact.

## Status

Complete.
