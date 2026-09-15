# Leads

**Source:** `src/app/(restricted)/leads/page.tsx`, view in
`components/LeadsListView.tsx` + `components/LeadDetailSheet.tsx`, hooks in
`hooks/`.

Sprint 1 Phase 3: wired to `apps.leads` — `GET /api/v1/leads/` (org-wide,
filterable by `status`, sortable by `created_at`/`status`/`email`) and
`GET /api/v1/leads/{id}/` (full record: interest note, consent notice
version, collected fields, linked conversation summary). Gated on
`lead:view` via `ROUTE_PERMISSIONS`/`NAV_ITEMS`.

## Status transitions (Sprint-1 gap closure)

`lead:manage` now exists and gates a status control in `LeadDetailSheet`:
`PATCH /api/v1/leads/{id}/status/` (`useLeadActions.ts`), offering only the
legal next state(s) per `LEAD_STATUS_TRANSITIONS` in
`apps/leads/constants.py` — `new` → `contacted`/`disqualified`, `contacted`
→ `qualified`/`disqualified`, `qualified`/`disqualified` terminal. A 409
(`lead_invalid_status_transition`) surfaces via the mutation's toast the same
as any other error; the picker never offers an illegal transition in the
first place.

`src/services/leads.ts` mirrors that table by hand, and
`src/services/__tests__/leads.test.ts` asserts the whole thing field for
field: nothing else fails if the mirror drifts, the picker would just start
offering a transition the API then refuses.

The **status itself** is shown to everyone who can open the sheet; only
changing it is gated. Terminal statuses, and users without `lead:manage`,
get a read-only `StatusBadge` rather than a picker with nothing to pick.
That badge's tone map lives in `leadStatusTone.ts`, shared with the list
table — extracted the moment a second consumer appeared, since two copies
drift and a lead reading "danger" in one place and "neutral" in the other is
the kind of thing nobody notices until a screenshot.

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

## Qualification outcome (2026-09-14)

The backend's L1-02 rule-based qualification engine (backend branch
`lead-qualification-l1-02-2026-09-14`) adds a system-computed tier alongside the
operator-set status. Both surfaces read it:

- **List**: `qualification_outcome` on every row, a `StatusBadge` column after
  Status, plus a `qualification_outcome` multi-select filter in the toolbar.
  `unqualified` is toned `neutral`, not `danger` — it is the default for every
  lead captured by an agent with no rules configured, so styling it as a failure
  would paint most of the table red and say nothing.
- **Detail**: the current tier, then `qualification_results`, the append-only
  evaluation history (`{outcome, score, missing_required_fields, created_at}`,
  newest first). A returning visitor who fills in a previously-blank field within
  the capture cooldown is re-evaluated and gets a _new_ row rather than
  overwriting the last, so this genuinely reads as history.

**Status and outcome are different claims and are rendered apart on purpose.**
`status` is the operator's workflow state set by hand; `qualification_outcome` is
the rules' own judgment against a specific `AgentVersion.qualification_config`.
Both vocabularies contain "Qualified". Never substitute one for the other.

`score` renders as a **raw point total, never a percentage.**
`QualificationResultSerializer` deliberately omits the `rule_snapshot` the weights
were summed from, so there is no denominator available. (Separately, the backend's
own schema docstring calls thresholds "percentages of the summed weight ceiling"
while `QualificationService.evaluate()` compares the raw sum — flagged to the
backend team, unresolved as of this sync.)

Filter keys must match `LeadSelector._FILTER_FIELDS`. Note the asymmetry:
`qualification_outcome` is **filterable but not sortable** (`_SORT_FIELDS` is
still `{created_at, status, email}`), so it must not be added to `sortOptions`.
Filters stay client-declared here because `LeadListView` still has no
`?type=parameters` branch, even though `LeadSelector.build_parameters_config()`
now builds one.

## Detail sheet pass (2026-09-15)

`LeadDetailSheet` titles itself with the lead's name (or email) and capture
time, and opens with a contact block: `mailto:`/`tel:` links, and the phone
number, which the sheet previously never showed. Status and qualification sit
side by side, then titled sections for interest, evaluation history, collected
fields, conversation and consent.

Two display bugs fixed: the linked conversation's status rendered as the raw
enum (`handoff_active`); it is now narrowed against `CONVERSATION_STATUS_VALUES`
and translated, since `LeadConversationSummary.status` is typed as a plain
string. Field keys in collected fields and "Missing: …" now use the
`qualifiableField` labels where one exists. In the list, a lead with no name no
longer shows its email twice.
