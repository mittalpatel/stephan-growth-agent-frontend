# Analytics (Sprint 1 static preview)

**Source:** `src/app/(restricted)/analytics/page.tsx`, view in
`components/AnalyticsView.tsx`

A static preview of `frontend-plan-v3.md` §3.1/§5's analytics summary. Renders five
fixed metric cards — `conversations`, `messages`, `escalations`, `leads`,
`unresolvedTopics` — matching the plan's D1 correction (`message_count` alongside
`conversation_count`, not four counts). No hook, no service call, no real range
selector (the pill is static).

When this becomes real: wire to `GET /api/v1/agents/{id}/analytics/summary/?range=`,
gate on `conversation:view` per the plan's D6 (there is no `ANALYTICS` resource), and
remove the `PreviewBanner`. Registered the same way as `/agents` for nav/proxy/matcher.
