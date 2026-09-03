# Conversations (Sprint 1 static preview)

**Source:** `src/app/(restricted)/conversations/page.tsx`, view in
`components/ConversationsListView.tsx`

A static preview of `frontend-plan-v3.md` §3.1/§5's operator inbox, rebuilt to match
the `ai-agents-platform` reference build's `ConversationsView` three-pane layout
exactly: a conversation list (visitor, topic, time, intent badge) on the left, the
active conversation's transcript in the middle (agent-labelled bubbles, a disabled
read-only composer), and a prospect metadata panel on the right (Intent/Interest/
Score, "View prospect" / "Generate follow-up"). Mock data lives in
`../mockConversations.ts` (`MOCK_CONVERSATIONS`), ported field-for-field from the
reference build's `data/conversations.ts`. Selecting a list row is real client state
(`activeId`) — everything downstream of that selection is still static.

Intent tones: `High` → warning, `Medium` → info, `Low` → success — matches the
reference build's own `StatusBadge` style map. When this becomes real, keep
escalation status two-state (open/resolved) per the plan's D2 — there is no backend
`/acknowledge/` action, so do not add a third visual state.

Registered the same way as `/agents` (see that page's doc for the nav/proxy/matcher
detail); also without a permission gate yet, pending the `conversation` code.
