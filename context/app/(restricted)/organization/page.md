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

## Status

Complete.
