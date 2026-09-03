# Conversations (Sprint 1 static preview)

**Source:** `src/app/(restricted)/conversations/page.tsx`, view in
`components/ConversationsListView.tsx`

A static preview of `frontend-plan-v3.md` §3.1/§5's operator inbox list. Renders
`MOCK_CONVERSATIONS` (inline, typed) — visitor, agent, last message, status,
updated — with a `PreviewBanner`. No hook, no service call.

Status tones: `open` → info, `escalated` → danger, `resolved` → success. When this
becomes real, keep escalation status two-state (open/resolved) per the plan's D2 —
there is no backend `/acknowledge/` action, so do not add a third visual state.

Registered the same way as `/agents` (see that page's doc for the nav/proxy/matcher
detail); also without a permission gate yet, pending the `conversation` code.
