# Billing

**Source:** `src/app/(restricted)/organization/billing/page.tsx`, view in
`components/BillingView.tsx`, hook in `hooks/useBilling.ts`.

New page (Sprint-1 gap closure, `apps.platform_config`'s new
`/api/v1/billing/` mount). Three independent reads:

- `GET billing/plans/` — every seeded `PlanTier` with its `PlanLimit`
  ceilings (`null` limits mean unmetered on that dimension, same convention
  as `Organization.seat_limit`). No permission gate; shown to everyone so a
  non-Owner can see what upgrading would unlock.
- `GET billing/subscription/` — gated `organization:billing` (Owner-only,
  the same code that already separates Owner from Admin on this settings
  page's danger zone). `subscription: null` is the normal "not provisioned"
  state, not an error; `useBilling.ts` only fires this query when
  `can('organization', 'billing')` is true, so a non-Owner never even
  attempts the call.
- `GET billing/usage/` — live per-org usage counters against the assigned
  plan's limits. No permission gate.

Nested under `/organization` like Integrations, gated via
`ROUTE_PERMISSIONS`'s `{ prefix: '/organization/billing', resources:
['organization'] }` — the page itself needs only `organization:view` to
open; the subscription panel's own tighter gate is a component-level check
inside, the same split `OrganizationSettingsView`'s danger zone already
uses for `transfer`/`delete`.
