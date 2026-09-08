# Agent settings

**Source:** `src/app/(restricted)/agents/[agentTypeSlug]/settings/components/AgentSettingsView.tsx`.

Sprint 1 Phase 4 (frontend integration plan). Net-new, no mock precedent.

**This is a tab, not a route.** It owned `/agents/[id]/settings` until the
agent detail page moved to the reference platform's tabbed layout; that
`page.tsx` is deleted and `AgentDetailView` renders this as its Settings tab,
passing the resolved `agent` rather than an id. The components and hooks stay
in this folder, which is now a plain directory rather than a route segment.

It carries the agent's own editable fields first (`AgentIdentitySection`,
moved here from what used to be the Overview tab), then two management
sections and an informational embed snippet, all under `apps/agents`'s
domain/key endpoints.

## View/manage split (backend 2026-09-07)

`AgentDomainListCreateView` and `AgentKeyListCreateView` gained `GET`
(previously create/delete/revoke only, despite the "ListCreate" name — see
git history for the prior "list-endpoint gap" this closed). `GET` is gated
`agent:view`, writes stay `agent:manage`, via `method_permissions` on the
backend. The page-level gate is now `agent:view`
(`AgentSettingsView.tsx`), and each section gates its own add/issue/remove/
revoke controls on `agent:manage` internally — a view-only holder sees the
lists but no mutating controls.

`useAgentDomains`/`useAgentDeploymentKeys` (`hooks/`) are real
`useAuthQuery` reads now, keyed by `agentDomainsKey`/`agentKeysKey` in
`src/services/agents.ts`, invalidated on every add/remove/issue/revoke —
the same shape as every other agent-nested resource. `issuedKey` stays
local `useState`, not part of the query: the raw secret is genuinely
one-time and never appears in a `GET` response.

## Hostname validation (backend 2026-09-07)

`AllowedDomainWriteSerializer`'s hostname check now goes through the
backend's shared `common/net/hostname.py::is_valid_hostname()` (also used by
the org custom-domains serializer — see `context/app/(restricted)/organization/page.md`),
requiring a proper multi-label hostname with an alphabetic-only TLD, with
`localhost` allowed as a one-off for local widget testing.
`agentDomainCreateSchema` (`src/lib/schemas/agent.ts`) mirrors this via
`isValidHostname(value, { allowLocalhost: true })` in `src/lib/hostname.ts` —
previously this schema had no shape validation at all, only a length check.

## Allowed domains

`AllowedDomainsSection` — a Zod+RHF form (`agentDomainCreateSchema` in
`src/lib/schemas/agent.ts`, mirroring `AllowedDomainWriteSerializer`'s one
field) posts `POST /agents/{id}/domains/` and invalidates the domains query;
removing calls `DELETE /agents/{id}/domains/{domainId}/` behind a
`ConfirmDialog`.

## Deployment keys

`DeploymentKeysSection` mirrors
`organization/api-keys/components/ApiKeysView.tsx`'s reveal-once discipline
exactly: `POST /agents/{id}/keys/` returns the only response that ever
carries the raw secret (`AgentDeploymentKeyIssuedSerializer`), held in
`issuedKey` state and shown once via `RevealDeploymentKeyDialog` (copied
near-verbatim from `organization/api-keys/components/RevealSecretDialog.tsx`).
The secret is never merged into the `keys` query and never touches its cache
entry. Revoking calls `POST /agents/{id}/keys/{keyId}/revoke/`, which
returns the updated row (`revoked_at` set); the keys query is invalidated
rather than patched in place, since a revoked key is still worth showing
and a refetch is cheap on a small, read-through-cached list.

## Embed snippet

`EmbedSnippetSection` is static, informational content: a `fetch()` example
showing the `X-Widget-Key` header (`WIDGET_KEY_HEADER` in
`apps/widgetgw/constants.py`) a customer's page would send to
`GET /widget/config/` (mounted outside `/api/v1/`, unauthenticated,
publishable-key-gated). It intentionally does not interpolate a real issued
secret into the snippet — the placeholder `YOUR_DEPLOYMENT_KEY` stays
generic so nothing beyond the reveal dialog ever displays a real secret.

## Route protection

No new `ROUTE_PERMISSIONS` entry, same reasoning as the knowledge route:
`{ prefix: '/agents', resources: ['agent'] }` already covers every
`/agents/[agentId]/**` route.
