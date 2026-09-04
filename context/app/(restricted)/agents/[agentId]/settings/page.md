# Agent settings

**Source:** `src/app/(restricted)/agents/[agentId]/settings/page.tsx`, view
in `components/AgentSettingsView.tsx`.

Sprint 1 Phase 4 (frontend integration plan). Net-new page, no mock
precedent. Linked from `AgentDetailView`'s header (a "Settings" button,
gated `agent:manage`). Two management sections plus an informational embed
snippet, all under `apps/agents`'s domain/key endpoints.

## The list-endpoint gap

`AgentDomainListCreateView` and `AgentKeyListCreateView` (despite their
names) expose only `POST` (and, for domains, `DELETE`/for keys, revoke) —
there is no `GET /agents/{id}/domains/` or `GET /agents/{id}/keys/`, and
`AgentSerializer` embeds neither. This means the frontend has no way to read
back domains or deployment keys configured before the current page load.

`useAgentDomains`/`useAgentDeploymentKeys` (`hooks/`) reflect this honestly:
`domains`/`keys` are plain `useState` arrays seeded only by what this
session adds or issues, not a query cache — there is nothing to invalidate
or refetch because there is nothing to fetch. Both sections carry a
`sessionOnlyNote` in the UI saying so explicitly, rather than presenting an
empty list as "no domains configured." This is a real backend gap, the same
shape as Phase 3's escalation-resolve gap: the fix is either a `GET` list
view per resource or embedding `allowed_domains`/`deployment_keys` (prefix
and revocation state only, never `key_hash`) on `AgentSerializer`.

## Allowed domains

`AllowedDomainsSection` — a Zod+RHF form (`agentDomainCreateSchema` in
`src/lib/schemas/agent.ts`, mirroring `AllowedDomainWriteSerializer`'s one
field) posts `POST /agents/{id}/domains/` and appends the response to local
state; removing calls `DELETE /agents/{id}/domains/{domainId}/` behind a
`ConfirmDialog`. Gated `agent:manage` (there's no narrower `agent:manage`-vs-
view split for this feature since there is no view-only content).

## Deployment keys

`DeploymentKeysSection` mirrors
`organization/api-keys/components/ApiKeysView.tsx`'s reveal-once discipline
exactly: `POST /agents/{id}/keys/` returns the only response that ever
carries the raw secret (`AgentDeploymentKeyIssuedSerializer`), held in
`issuedKey` state and shown once via `RevealDeploymentKeyDialog` (copied
near-verbatim from `organization/api-keys/components/RevealSecretDialog.tsx`).
The secret is never merged into the `keys` list and never touches a query
key or the TanStack cache. Revoking calls
`POST /agents/{id}/keys/{keyId}/revoke/`, which returns the updated row
(`revoked_at` set) — used to patch the local list in place rather than
removing the entry, since a revoked key is still worth showing.

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
