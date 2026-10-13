# Analytics

**Source:** `src/app/(restricted)/analytics/page.tsx`, view in
`components/AnalyticsView.tsx`

Real org-wide figures, read through `useDashboardAnalytics` (dashboard hook):
a client-side sum of each agent's `GET /agents/{id}/analytics/summary/?range=`.
The dashboard and this page therefore always show the same numbers. Range
toggle is 7d / 30d / 90d (`AnalyticsRange`).

Sections:

- Five metric cards (conversations, messages, escalations, leads, unresolved
  topics), with a zero-activity line when there are no conversations yet and a
  warning strip when any per-agent read failed.
- "By agent" table from the same per-agent summaries.
- "Detailed reports" teaser: blurred placeholder shapes (never numbers) under
  an overlay with a "Subscribe to a plan to see more" CTA to
  `/organization/billing`. The header's Export button is locked and points at
  billing too. Nothing paid is sent to the browser, so the blur is decoration.

History: until 2026-10-07 this page was a static preview with hardcoded sample
figures behind `PreviewBanner`. Client testing mistook them for real data and
asked for them to be removed, so the page was wired to the existing summary
endpoint and the banner component was deleted.

Open with the backend: the summary endpoint should exclude test-console
conversations (`Conversation.is_test`), and export / paid-plan gating does not
exist yet.
