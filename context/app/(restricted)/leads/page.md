# Leads

**Source:** `src/app/(restricted)/leads/page.tsx`, view in
`components/LeadsListView.tsx` + `components/LeadDetailSheet.tsx`, hooks in
`hooks/`.

Sprint 1 Phase 3: wired to `apps.leads` — `GET /api/v1/leads/` (org-wide,
filterable by `status`, sortable by `created_at`/`status`/`email`) and
`GET /api/v1/leads/{id}/` (full record: interest note, consent notice
version, collected fields, linked conversation summary). Gated on
`lead:view` via `ROUTE_PERMISSIONS`/`NAV_ITEMS` — this app has no
`lead:manage`, only `lead:view` (`LeadDetailView`/`LeadListView` are both
read-only; there is no lead-editing endpoint).

## Collapsed from the Sprint 1 preview's two-table layout to one

The static preview split "Website prospects" (a fabricated intent-scored
funnel) from "Outreach leads" (Meta/referral-sourced). Neither maps onto the
real data model: a `Lead` is agent-scoped and belongs to one flat table with
one `LeadStatus` enum (`new`/`contacted`/`qualified`/`disqualified`) — there
is no prospect/outreach split, no pipeline-stage funnel, and no
leads-summary endpoint to source a metric row's numbers from. Per the plan's
own guidance ("don't fabricate numbers"), the metric row and pipeline funnel
were dropped rather than wired to nothing; `mockLeads.ts` (`MOCK_LEADS`,
`MOCK_PROSPECTS`, `LEAD_PIPELINE`) is deleted.

`LeadSelector` also accepts an `agent` filter — not exposed in the toolbar
since there's no cheap agent-name lookup to build a filter option list from
here (the same `useAgentOptions()` used by the conversations page could
back one later).

## Row click opens a detail sheet

Clicking a table row (via `DataTableRow`'s new `onClick` prop — added in
this phase since no prior table needed row-level interactivity; the
underlying `MotionListItem` now forwards `onClick` too, see
`components.md`) opens `LeadDetailSheet`, showing the lead's collected
fields and its linked conversation's status/date (not a link into the
conversations page — that page has no per-conversation deep link yet).
