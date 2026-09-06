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
rename/danger-zone content moved unchanged into a "General" tab; four new
tabs each own one settings resource, resolved against the session tenant
(`/api/v1/settings/{organization,brand,ai-preferences,security}/` — no
organization id in the URL, unlike every other endpoint on this page):

- **Brand** (`BrandSettingsTab`/`useBrandSettingsForm.ts`): logo URL, primary
  color (client-validated hex, mirroring the backend's own
  `THEME_COLOR_MUST_BE_HEX`-style guard), tone of voice, company description.
- **AI preferences** (`AiPreferencesTab`/`useAiPreferencesForm.ts`): three
  switches — require approval before outreach/publishing, allow
  auto-CRM-updates.
- **Security** (`SecuritySettingsTab`/`useSecuritySettingsForm.ts`): require
  2FA, log all agent actions.
- **Data** (`DataSettingsTab`/`useOrganizationDataSettings.ts`): export
  history + request (`GET`/`POST /api/v1/settings/data/export/`, download via
  an authenticated blob fetch since the endpoint needs the session's
  credentials, not a plain link) and delete (`POST .../data/delete/` emails a
  confirmation link). The link lands on
  `/organization/data-delete-confirm` (`DataDeleteConfirmView`), a
  separate page since it's opened from an email outside this session's
  normal navigation — reads `?token=` and posts to
  `/api/v1/settings/data/delete/confirm/`.

All four gate their editable controls on `organization:manage`, matching the
General tab's existing convention; Data's export/delete actions gate on the
more specific `organization:export`/`organization:delete` instead, since
they're independently-granted codes (see `AGENTS.md`'s `MANAGE_IMPLIED` note).

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
