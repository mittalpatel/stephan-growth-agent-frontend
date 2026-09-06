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

## What the subscription panel actually renders

`SubscriptionDetailSerializer` returns `status` plus six independently
nullable dates (`trial_start`/`trial_end`, `current_period_start`/`_end`,
`grace_period_ends_at`, `canceled_at`). Most are null at any given moment, so
the panel shows only the one that matches the current `status` — trial end
while `trialing`, renewal date while `active`, grace-period end while
`past_due`, cancellation date once `canceled` — rather than a wall of empty
rows. Statuses are rendered through the locale catalog, never as the raw enum.

**The seats row is corrected client-side, deliberately.** `UsageSelector`
reports `PlanLimit.max_seats` and its docstring says it will not consult
`organization.seat_limit` (it does not want a second copy of that override
logic). Invite-time enforcement does consult it:
`MembershipService._effective_seat_limit()` prefers an explicit `seat_limit`
and only falls back to the plan's `max_seats`. Left alone, an organization
with an override would read a seat ceiling here that is not the one it hits
when inviting. `useBilling` applies the same precedence using the
`seat_limit` it already has from `useOrganizationPlan` (same query key as the
settings page, so no extra request). If the backend ever folds the override
into the selector, delete this and the number stays correct.

`UsageSelector` returns the `PlanLimit` **field names** verbatim as its `key`s
(`max_agents`, `max_seats`, …). Those are backend identifiers, not copy, so
`BillingView` maps them through `t.billing.usage.keys` rather than printing
them. `limit: null` renders as "Unlimited"; a `limit` of `0` is a real
ceiling, so the metered check compares against `null` explicitly instead of
relying on truthiness, and usage above its limit is called out in
`text-destructive`.

The plan grid marks the organization's own tier with a "Current plan" badge,
resolved from the subscription read — so only a user who may read the
subscription sees it highlighted. That is correct rather than a gap: everyone
else has no way to know which tier is theirs, and inferring it from usage
limits would sometimes be wrong.

Nested under `/organization` like Integrations, gated via
`ROUTE_PERMISSIONS`'s `{ prefix: '/organization/billing', resources:
['organization'] }` — the page itself needs only `organization:view` to
open; the subscription panel's own tighter gate is a component-level check
inside, the same split `OrganizationSettingsView`'s danger zone already
uses for `transfer`/`delete`.
