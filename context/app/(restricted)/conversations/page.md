# Conversations

**Source:** `src/app/(restricted)/conversations/page.tsx`, view in
`components/ConversationsListView.tsx`, hooks in `hooks/`.

Sprint 1 Phase 3: wired to `apps.conversations` — `GET
/agents/{id}/conversations/` (list, filterable by `status`, sortable by
`created_at`/`updated_at`/`status`) and `GET /conversations/{id}/` (full
transcript with messages and citations). Gated on `conversation:{view,manage}`
via `ROUTE_PERMISSIONS`/`NAV_ITEMS`.

## Agent picker, not agent-nested route

The backend has no cross-agent conversations endpoint — every read is scoped
to one agent. Rather than moving this page under `/agents/[agentId]/...`
(which would drop the sidebar's single "Conversations" nav item), the page
keeps an agent-picker (`useAgentOptions()`, a lightweight unpaginated
`GET /api/v1/agents/?page_size=200`) and re-runs `useConversationsList(agentId)`
whenever the selection changes. Defaults to the first agent returned.

## List/detail/toolbar

`useConversationsList` mirrors `useKnowledgeSources`'s shape but has no
search field (`ConversationSelector` declares none) and its `status`
`FilterConfig` is hand-built from `CONVERSATION_STATUS_VALUES` in
`src/services/conversations.ts` — `AgentConversationListView` never wires up
a `?type=parameters` route despite its selector supporting one, the same gap
`apps.knowledge`'s source list has (see that page's doc). `date_from`/
`date_to`/`has_escalation` (which the selector does support, via raw
`request.GET.get()` reads rather than the generic filter contract) are not
wired into the toolbar — out of scope for this pass; add them as plain query
params (not through `filter`/`filter_by`) if a future pass needs them.

Selecting a row loads that conversation's detail (`useConversationDetail`)
into the transcript pane; messages render visitor/agent/operator bubbles,
citations show under a message compactly rather than as a separate panel.

## Assign operator, but no escalation resolve

`conversation:manage` unlocks an "assign operator" control in the side panel
(`POST /conversations/{id}/assign/`, operator list from
`organizationMembersEndpoint`). Escalation resolve (`POST
/escalations/{id}/resolve/`) is **not built**: `ConversationDetailSerializer`
never embeds a conversation's escalations, and there is no other read path
that returns an escalation id to this UI. A `handoff_requested`/
`handoff_active` conversation is visible via its status badge, but there is
currently no way for an operator to discover _which_ escalation record to
resolve, or its `reason`, from the frontend. This is a real backend gap, not
a scope choice — flagging it here for whoever picks it up (the fix is
either an `escalations` field on `ConversationDetailSerializer` or a
`GET /conversations/{id}/escalations/` read).

## Removed with this phase

`mockConversations.ts` and its `MOCK_CONVERSATIONS`/`ConversationIntent`
types are deleted — the mock's `intent`/`score`/`company` fields have no
backend equivalent (`Conversation` has no lead-scoring concept; that lives
on `Lead`, a separate resource). `PreviewBanner` is gone from this page.
