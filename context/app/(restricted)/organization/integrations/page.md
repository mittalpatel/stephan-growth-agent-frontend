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

Nested under `/organization` (a child nav item, not a top-level page) since
it's an organization-level configuration surface like API keys or billing,
not a daily-use feature. Gated via `ROUTE_PERMISSIONS`'s
`{ prefix: '/organization/integrations', resources: ['integration'] }` —
longest-prefix match picks this over the parent `/organization` rule
regardless of array order (see `roles.ts`'s own doc comment).
