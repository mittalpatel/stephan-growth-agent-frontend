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
`date_to` are still not wired into the toolbar.

`has_escalation` (2026-09-16) **is** wired in, but not through the generic
`filter`/`filter_by` contract every `multi_select` `FilterConfig` uses —
`ConversationSelector._apply_list_filters` reads it as its own top-level
`request.GET.get("has_escalation")`, the first `"boolean"`-typed filter in
this codebase. It rides `useQueryParams`'s ad-hoc `getParam`/`setParam` pair
instead (added to `CUSTOM_PARAM_KEYS` so `clearAllFilters` purges it too), and
`ConversationListQuery.has_escalation` is appended to the query string
directly in `conversationsListUrl`, bypassing `buildListParams`. The
`FilterToolbar` UI still treats it as an ordinary `single_select`
`FilterConfig` with `true`/`false` options — only the storage layer differs,
via `useConversationsList`'s own `onFilterChange` branching on the column key.

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
toward page 1. `olderPageParam` and `flattenTranscript` are unit-tested
directly — the page direction and the reverse-the-pages-not-the-rows ordering
are the two things most likely to break silently.

This is a consumer of `useAuthInfiniteQuery` (`src/hooks/`), added alongside
it: `useAuthQuery`'s accumulating sibling, for reads whose pages stack in the
UI. Ordinary lists must keep using `useQueryParams` so they stay linkable;
this hook's page state is deliberately local, which a transcript inside a
detail panel wants and a list screen does not.

**Split into hook and presenter (2026-09-16).** The backend added
`GET /leads/{id}/conversation/messages/`, a contract-identical read of the
same rows under `lead:view` instead of `conversation:view`, so the lead detail
sheet now shows a transcript too. Rather than duplicate ~180 lines of bubble
rendering, the shared parts were extracted:

- `src/hooks/useTranscriptQuery.ts` owns the backwards paging, the live-poll
  cadence and the two pure helpers, parameterized by query key and endpoint.
  `useConversationMessages(conversationId, { live })` is now a thin wrapper
  over it that keeps its previous public signature, and it finally uses the
  `conversationMessagesPrefixKey` helper instead of rebuilding that key inline.
- `ConversationTranscript` moved to `src/components/common/` as a pure
  presenter taking transcript state as props (see `context/components.md`). It
  used to call the hook itself, which blocked reuse and broke this repo's
  hook/presenter rule.

`ConversationsListView` therefore calls `useConversationMessages` itself and
spreads the result. It still keys the component on the conversation id, but
for a different reason than before: the accumulated pages are already
discarded by the query key changing with `activeId`, so the key now only
resets the component's scroll position and pinned-to-bottom ref.

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
worse than either being stale alone. The status driving `live` comes from the
cached detail once it exists (claim/release patch that cache directly while
the list row can be seconds stale), falling back to the list row so polling is
on for the first detail fetch.

Since 2026-09-15 the poll is the **backstop**, not the delivery path: see
"Explicit handoff" below for the socket pushes.

The list itself is deliberately **not** polled. That is the boundary: a
conversation newly escalating shows up on the next list fetch or refresh, not
live. Polling every row's status continuously is a bigger commitment than
this phase justifies, and the org-wide `?status=handoff_requested` filter is
the cheaper way to find them.

## Explicit handoff: claim, release, resolve (2026-09-15)

Shipped on the backend in `fix/lead-qualification-review-findings-2026-09-14`
(commit `74c6bfc`) — endpoints, socket events, and the escalation history read
path below are all live.

Taking a conversation over used to happen only as a side effect of the first
operator reply, and nothing could hand it back: `EscalationService.resolve()`
is what returns a conversation to `open`, but no read path exposes an
escalation id, so a conversation sat in `handoff_active` with the AI silent
indefinitely. The fix is explicit transitions between the statuses that
already existed (no new statuses):

| Call (`conversation:manage`)                | Transition                                                     | Notes                                                                                      |
| ------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `POST /conversations/{id}/handoff/claim/`   | `open`/`handoff_requested`/`handoff_active` → `handoff_active` | Assigns the caller. No lock: claiming a colleague's conversation is a legitimate takeover. |
| `POST /conversations/{id}/handoff/release/` | `handoff_active` → `open`                                      | AI resumes. Assignment is kept.                                                            |
| `POST /conversations/{id}/resolve/`         | any active → `resolved`                                        | Closed.                                                                                    |

Each returns the full conversation; `useConversationHandoff` writes it into
the detail cache and invalidates the list. No `onMutate` optimism, so an
in-flight 5s poll cannot flip the badge back for a cycle.

**Composer.** `OperatorReplyComposer` unlocks only when the status is
`handoff_active` **and** it is assigned to the signed-in user, which is server
state, not a local toggle. Otherwise it shows a take-over button (naming the
colleague when someone else holds it); on `resolved`/`abandoned` it shows a
closed line instead. A dirty draft is never unmounted by a status push: it
stays on screen with submit disabled. The composer's `key` is the
conversation only, never its status, for the same reason.

**Header.** "Return to AI" (only in `handoff_active`) and "Resolve" (any
active status) sit beside the status badge in
`ConversationHandoffControls.tsx`, both behind `useConfirm()`.

**Realtime and presence.** `useConversationRealtime(activeId)` subscribes
through `RealtimeProvider` (see `context/components.md`). Pushes:
`conversation_message` invalidates the list, plus the transcript only for the
open conversation; `conversation_status_changed` patches the detail's
`status`/`assigned_operator_email`, then invalidates the list;
`conversation_presence` stays in local state and never enters React Query.
Outbound it sends `viewing` on open, `typing` at most every 3s while typing
(back to `viewing` after 5s idle), a 25s heartbeat, and `left` on row switch,
unmount, tab hide, and `beforeunload`. The backend treats a dropped socket as
departure and expires presence on a ~60s TTL, so a stale "is viewing" after a
crashed tab clears itself; that is accepted, not a client bug. Presence shows
other operators only.

**Escalation history.** `ConversationDetailSerializer.escalations` returns
every escalation this conversation has had (`{id, reason, created_at,
resolved_at}`), and `active_escalation` on the list/detail row surfaces the
current unresolved one — see `types/conversation.ts`. As of 2026-09-16 the UI
surfaces both: the detail header shows a `warning`-toned `StatusBadge` chip
for the active escalation's reason next to the status badge, and the right
panel has an "Escalation history" section listing every escalation with its
reason and either its resolved time or "Still open". `EscalationReason` was
also corrected to match the backend's actual enum — the type had drifted to
`'low_confidence' | 'explicit_request' | 'operator_initiated'`, missing six
real values (`visitor_requested`, `sensitive_topic`,
`self_harm_or_high_risk`, `abuse`, `tool_failure`, `unsupported_language`)
and carrying one, `explicit_request`, that was never a real backend value.
`operator_claimed` (backend 2026-09-15 review follow-up, `claim()` always
leaving an open `Escalation` behind) is new. Every reason has locale copy
under `t.conversations.detail.escalationReason`, with a neutral fallback for
anything unrecognized rather than rendering the raw enum value.

`handoff_trigger_matched` (backend 2026-09-17) is the newest addition: a
deterministic, admin-configured phrase list
(`behavior_config.handoff_trigger_phrases`, see
`context/app/(restricted)/agents/page.md`'s "Handoff trigger phrases" section)
hands a conversation off whenever a visitor message contains one, before any
moderation/retrieval/completion call. It shows up in both the active-escalation
badge and the escalation history list the same as any other reason — no
component change was needed, since both display sites already index the reason
dynamically off the locale map rather than switching on known values.

## Assign operator

`conversation:manage` unlocks an "assign operator" control in the side panel
(`POST /conversations/{id}/assign/`, operator list from
`organizationMembersEndpoint`). It routes a conversation to a colleague and
does not change status; taking a conversation over yourself is claim, above.

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

## Transcript scrolling (2026-09-15)

The three-column box is `h-[min(760px,calc(100dvh-10rem))]` with
`lg:grid-rows-[minmax(0,1fr)]`, and the middle column is `min-h-0` with a
`shrink-0` header and composer. Without those height floors the transcript grew
past the box and `overflow-hidden` clipped the composer instead of the messages
scrolling. The transcript is the only scroll region (thin scrollbar, stable
gutter) and follows new turns only while the reader is within 80px of the
bottom; loading older pages never moves it.

## Status colours (2026-09-15)

`STATUS_TONE` gives every status its own `StatusBadge` tone: `open` info (blue),
`handoff_requested` danger (red, a visitor is waiting on a human),
`handoff_active` warning (amber, a human is handling it), `resolved` success
(green), `abandoned` neutral (grey). The two handoff states used to share amber.

`abandoned` has two sources since the backend's widget session lifecycle (2026-09-21):
the visitor ending the chat from the widget, and an hourly sweep that abandons an
`open` or unclaimed `handoff_requested` conversation once its visitor session has
idled 24 hours or reached the 7 day cap. A conversation with an operator attached
(`handoff_active`) is exempt from the idle rule. So an `abandoned` row can now appear
with no visitor action, and there is no field telling the two apart. Nothing to
render differently: the status type, label and tone already cover it.
