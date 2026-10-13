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

## The Languages picker (backend 2026-09-18)

`AgentIdentitySection` also owns `enabled_languages` and `default_language`,
added when the backend shipped validation for them
(`feat/multi-language-support-2026-09-18`). Both write through the same
`PATCH /agents/{id}/` as name/email/status. Before this, **no UI existed for
either field**, so every agent had been stuck at `enabled_languages: ["en"]`
since provisioning.

- `src/lib/constants/agentLanguages.ts` mirrors the backend's
  `SUPPORTED_LANGUAGE_CODES` (45 curated ISO 639-1 codes, no locale variants)
  and is cited by that constant in return, so the mirror is documented from
  both ends. The codes are a `const` tuple, which is what lets `z.enum()`
  consume them without a cast and makes the display-name map total: a code
  with no name fails the build rather than rendering blank.
- `agentUpdateSchema` mirrors all three server rules, including the cross-field
  one, bound via `path: ['default_language']` so a client-side failure lands on
  the same input the backend's own error targets.
- The default-language select's options are narrowed with `useWatch` to
  whatever is currently ticked, so the two fields cannot visibly disagree
  before submit. The schema's `refine` still covers the case where the
  currently-selected default gets unticked.

**The consequence worth knowing:** publish requires `greeting`,
`fallback_message`, and `disclosure_text` for _every_ enabled language
(`AgentService._assert_localization_complete`). Enabling five languages creates
15 mandatory fields on the Draft tab. The picker's description says so, because
nothing else in the app does: there is no client-side publish gate and no
per-language completeness indicator, so `missing_language_localization` arrives
as a bare server-message toast after the Publish click. That gap is real and
not addressed here.

Not a concern, though it looks like one: `useAgentDraftForm`'s reset effect is
keyed on `enabledLanguages.join(',')` and rebuilds the whole draft form when the
list changes. `AgentDetailView` renders tabs through Radix `TabsContent` with no
`forceMount`, so the Draft tab is already unmounted whenever Settings is on
screen.

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

## Route redirect (2026-10-07)

`settings/page.tsx` redirects `/agents/<slug>/settings` to `?tab=settings`, so
old links and the breadcrumb no longer 404 (same fix as Knowledge).

## Widget preview on the embed step (2026-10-13)

`EmbedSnippetSection` now takes the `agent` and offers "Preview widget" once a
version is published. `usePublishedWidgetPreview` fetches that version only
when opened (`useAgentVersion`) and maps it with `versionToFormValues`
(exported from `useAgentDraftForm`) into `WidgetPreviewView`, the form-free
half of the draft tab's `WidgetPreview`, opened by default in the screen
corner. Client review (06 Oct 2026) asked to see the widget before embedding.
