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

`AgentIdentitySection`'s `human_inbox_email` field (`t.agents.form.
inboxEmailLabel`) is where both handoff and lead-captured emails go
(2026-09-18: the description text was updated when the lead-captured email
was enriched, `apps.leads.tasks.notify_lead_captured` on the backend — this
is the §5.1 "human inbox/contact to receive lead notifications and handoff
requests" prerequisite from the client scope doc, one field doing both
jobs).

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

## Embed code (backend 2026-09-07)

`EmbedSnippetSection` used to be static, informational content only (a
`fetch()` example with a `YOUR_DEPLOYMENT_KEY` placeholder, no API call).
`POST /agents/{id}/embed-code/` (`AgentEmbedCodeView`) closed that gap: it's
a distinct, dedicated endpoint from key issuance (not an extension of
`AgentKeyListCreateView`'s response) that mints a fresh deployment key via
the same `AgentDeploymentKeyService.issue()` and returns a ready-to-paste
`<script>` snippet (`{ key_prefix, embed_snippet, created_at }`), gated
`agent:manage`. `useAgentEmbedCode` (`hooks/`) holds the result in local
`useState`, not a cached query, same reveal-once rationale as `issuedKey`:
the snippet embeds a fresh raw secret every call, so there is nothing to
invalidate against. `EmbedSnippetSection` shows it once with the same
one-time-secret warning and copy affordance as `RevealDeploymentKeyDialog`.

## Route protection

No new `ROUTE_PERMISSIONS` entry, same reasoning as the knowledge route:
`{ prefix: '/agents', resources: ['agent'] }` already covers every
`/agents/[agentId]/**` route.

## Layout pass (2026-09-15)

`AgentSettingsView` groups Allowed domains and the embed code under one
"Install on your website" heading as **Step 1** and **Step 2**: the order was
already right, but nothing said the snippet depends on the domain, and a
snippet pasted before its domain is allowed fails silently. Issued keys stay
below as the audit list.

- `AgentIdentitySection` has its own title, Save is disabled until the form is
  dirty, "Discard changes" appears when it is, and the read-only type, slug and
  created date sit in a separate "About this agent" list below the inputs.
- Domain and key rows are bordered lists with labelled dates ("Added",
  "Created", "Revoked"); active keys sort above revoked ones.
- The domains description no longer contains an em-dash.
