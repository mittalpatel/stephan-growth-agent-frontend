# Integrations

**Source:** `src/app/(restricted)/organization/integrations/page.tsx`, view
in `components/IntegrationsView.tsx`, hook in `hooks/useIntegrations.ts`.

New page (Sprint-1 gap closure, `apps.integrations_catalog`, a brand-new
backend app). A card grid of the org's connectable CRM/lead-ads/messaging/
email tools: `GET /api/v1/integrations/` (never cached, no filters — the
catalog is small and fixed), `POST .../{id}/connect/`
(`{credential_reference?, detail?}`, sent as `{}` today — there's no
credential-collection UI yet since the backend side is a stub with no real
external call) and `POST .../{id}/disconnect/`, both gated
`integration:manage`; viewing the catalog only needs `integration:view`.

Pending state is tracked **per integration id**, not as one shared
`isPending`: the catalog renders every integration at once, so a single flag
would grey out every other card's button while one of them is mid-request.
Both mutations use `mutate` (which never rejects) rather than `mutateAsync`,
since nothing awaits them and an un-awaited `mutateAsync` leaves an unhandled
rejection behind even though `onError` already reported it.

The connect/disconnect **response** is a different shape from a list row
(`OrgIntegrationStatusSerializer` nests the catalog entry and never echoes
`credential_reference`), so it has its own type, `OrgIntegrationStatusResponse`.
Nothing reads it today — both mutations just invalidate the list — but typing
it correctly stops the next caller assuming a flattened row.

Cards also show `detail` (whatever the connect call stored, e.g. an account
name) when present and the `connected_at` date when connected; both were
returned by the endpoint and dropped by the first version of this page.

Nested under `/organization` (a child nav item, not a top-level page) since
it's an organization-level configuration surface like API keys or billing,
not a daily-use feature. Gated via `ROUTE_PERMISSIONS`'s
`{ prefix: '/organization/integrations', resources: ['integration'] }` —
longest-prefix match picks this over the parent `/organization` rule
regardless of array order (see `roles.ts`'s own doc comment).
