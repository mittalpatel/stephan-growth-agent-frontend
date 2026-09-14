# Conversations

**Source:** `src/app/(restricted)/conversations/page.tsx`, view in
`components/ConversationsListView.tsx`, hooks in `hooks/`.

Sprint 1 Phase 3: wired to `apps.conversations` — `GET
/agents/{id}/conversations/` (list, filterable by `status`, sortable by
`created_at`/`updated_at`/`status`) and `GET /conversations/{id}/` (full
transcript with messages and citations). Gated on `conversation:{view,manage}`
via `ROUTE_PERMISSIONS`/`NAV_ITEMS`.

## Agent picker, not agent-nested route

Rather than moving this page under `/agents/[agentId]/...` (which would drop
the sidebar's single "Conversations" nav item), the page keeps an
agent-picker (`useAgentOptions()`, a lightweight unpaginated
`GET /api/v1/agents/?page_size=200`) and re-runs `useConversationsList(agentId)`
whenever the selection changes.

**Defaults to every agent (backend 2026-09-14).** The picker originally had
no "all" option because no cross-agent endpoint existed, so the page opened
on whichever agent happened to be first. `GET /conversations/`
(`ConversationListView`) is that endpoint, added specifically so an admin can
see which conversations need a human without querying once per agent, and it
takes the same filter/sort contract as the agent-scoped route. So
`useConversationsList` now takes `string | null`, where `null` selects the
org-wide URL and its own cache slot (`conversationsListKey(null)`), and the
picker's `ALL_AGENTS` sentinel is the default. The sentinel exists because
Radix `Select` cannot carry an empty-string value; `agentId === ''` still
means "no selection yet" and is the one case the query stays disabled for.

Combined with the `status` filter, `?conversations_filter=handoff_requested`
is now the operator queue this page was missing.

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
into the side panel; messages render as per-role bubbles (see "Human handoff"
below), citations show under a message compactly rather than as a separate
panel.

### The transcript is its own paginated read (2026-09-11)

`ConversationTranscript` + `useConversationMessages` read
`GET /conversations/{id}/messages/`, **not** the detail response's embedded
`messages` array. Two reasons, and the second is the real one:

- `ConversationSelector.get_conversation()` caps the embedded array at
  `DETAIL_INLINE_MESSAGE_LIMIT` (50), so anything longer was simply
  unreadable here, with no control and no signal that it had been cut.
- `Message.Meta.ordering` is **ascending**, so that cap keeps the _oldest_
  50 messages, not the most recent. On a long conversation the panel was
  showing the opening and hiding the end, which on an escalated chat is
  precisely the part an operator needs. (The backend serializer's own
  comment claims "most recent first"; it does not match the slice. Reported
  to the backend team, not worked around here beyond not using the field.)

Paging therefore runs **backwards**, which nothing else in this app does:
the hook opens on `?page=last` (resolved server-side by DRF's
`PageNumberPagination.last_page_strings`, so the newest page costs one
request and no count round trip), and "Load earlier messages" walks down
toward page 1. `olderPageParam` and `flattenTranscript` are exported from the
hook and unit-tested directly — the page direction and the
reverse-the-pages-not-the-rows ordering are the two things most likely to
break silently. The component is keyed on the conversation id so switching
rows discards accumulated pages rather than carrying them across.

This is the one consumer of `useAuthInfiniteQuery` (`src/hooks/`), added
alongside it: `useAuthQuery`'s accumulating sibling, for reads whose pages
stack in the UI. Ordinary lists must keep using `useQueryParams` so they stay
linkable; this hook's page state is deliberately local, which a transcript
inside a detail panel wants and a list screen does not.

**Markdown rendering (2026-09-11)**: an agent bubble's `m.content` goes
through `src/components/common/Markdown.tsx` (same component the Test tab
uses), not a plain `<p>` — an inline `[1]`-style citation marker or any
other formatting the answer carries now renders instead of showing as
literal syntax. A visitor bubble stays plain text on purpose: it's exactly
what the visitor typed, not backend-composed content, and `Markdown`'s link
colour (`text-primary`) would fail contrast against that bubble's
`bg-primary` fill anyway. The citations line under a message now links each
`source_title` to its `source_url` (when the citation has one) instead of
listing bare, unclickable titles.

## Human handoff: replying as an operator (backend 2026-09-14)

The backend's handoff state machine became real in this branch: the AI goes
silent while a conversation is `handoff_requested`/`handoff_active`, and the
**first operator reply** is what flips `handoff_requested` to
`handoff_active`. Assignment does not do this. Ownership and taking over are
deliberately separate signals on the backend, so they are separate controls
here too: the assign `Select` stays in the side panel, and replying lives
with the transcript.

`OperatorReplyComposer.tsx` posts `POST /conversations/{id}/messages/send/`
(`useConversationActions.sendMessage`, `conversation:manage`). It is a
RHF+Zod form like every other form here, with `operatorMessageSchema`'s
`content` field named and capped (4000) to match
`OperatorMessageSendSerializer` exactly so a backend field error binds inline
rather than landing as a toast. The mutation is the one in that hook without
an `onError`, for that reason. On success it invalidates three reads: the
transcript (a new message), the detail (the status may have just flipped),
and the whole conversations list key (status is both a column and a filter,
and the row may be in either the org-wide or an agent-scoped cache slot).

**Operator messages are now visually distinct.** Every non-visitor role used
to render as the same muted bubble, so a colleague's reply was
indistinguishable from the AI's. An operator bubble now carries its own
surface and a byline reading `sent_by_email` (new on `MessageSerializer`,
null on anything sent before the backend started recording it, in which case
the role label stands in). A `system` turn renders as centered muted text
rather than a bubble at all: it is a state change, not something anyone said.

**Empty-content turns are filtered out of the transcript.** When a visitor
writes again while already waiting for a human, the backend persists a turn
with empty content rather than re-sending the same "someone is coming" line.
The widget already excludes those; here they were rendering as blank bubbles.

### Live refresh while a handoff is open

The visitor's widget gets a real SSE stream. The operator side has no push
channel: the backend explicitly deferred the WebSocket admin dashboard to a
later phase. Without one, an operator sends a reply and then sits looking at
a transcript that never updates.

`useConversationMessages` and `useConversationDetail` therefore both take a
`live` flag that sets `refetchInterval` (5s, matching the backend widget
stream's own server-side poll interval). It is on **only** while the selected
conversation is in one of the two handoff states, which is the only time
someone is sitting on this screen waiting for a reply. Both are polled
together on purpose: a transcript that advances under a stale status badge is
worse than either being stale alone. `live` is read off the list row rather
than the detail response, so polling is on for the first detail fetch instead
of switching on a render later.

The list itself is deliberately **not** polled. That is the boundary: a
conversation newly escalating shows up on the next list fetch or refresh, not
live. Polling every row's status continuously is a bigger commitment than
this phase justifies, and the org-wide `?status=handoff_requested` filter is
the cheaper way to find them.

## Assign operator, but still no escalation resolve

`conversation:manage` unlocks an "assign operator" control in the side panel
(`POST /conversations/{id}/assign/`, operator list from
`organizationMembersEndpoint`). Escalation resolve (`POST
/escalations/{id}/resolve/`) is **still not built**:
`ConversationDetailSerializer` never embeds a conversation's escalations, and
there is no other read path that returns an escalation id to this UI. A
`handoff_requested`/`handoff_active` conversation is visible via its status
badge, but there is currently no way for an operator to discover _which_
escalation record to resolve, or its `reason`, from the frontend.

**This gap got more expensive on 2026-09-14.** `EscalationService.resolve()`
now also returns the conversation to `open`, which is the only way a
conversation goes back under AI control. So the missing read path is no
longer just a missing admin convenience: an operator can take a conversation
over from this UI but has no way to hand it back, and it stays in
`handoff_active` with the AI silent indefinitely. Re-flagged for the backend
team, unchanged in substance: the fix is either an `escalations` field on
`ConversationDetailSerializer` or a `GET /conversations/{id}/escalations/`
read.

## Generate follow-up (Sprint-1 gap closure)

`conversation:manage` also unlocks a "Generate follow-up" button next to
"Assign operator": `POST /conversations/{id}/generate-followup/`
(`useConversationActions.ts`'s `generateFollowup`), no body, always 202. The
result isn't returned here — it shows up later as a `pending` row in the new
`/approvals` inbox (`context/app/(restricted)/approvals/page.md`), since the
endpoint only queues the work rather than running it synchronously.

## Removed with this phase

`mockConversations.ts` and its `MOCK_CONVERSATIONS`/`ConversationIntent`
types are deleted — the mock's `intent`/`score`/`company` fields have no
backend equivalent (`Conversation` has no lead-scoring concept; that lives
on `Lead`, a separate resource). `PreviewBanner` is gone from this page.
