# Leads (Sprint 1 static preview)

**Source:** `src/app/(restricted)/leads/page.tsx`, view in
`components/LeadsListView.tsx`

A static preview of `frontend-plan-v3.md` §3.1's leads list, rebuilt to match the
`ai-agents-platform` reference build's `Leads` page exactly: a 4-card metric row
(Total leads/Qualified/Website prospects/Conversion), a "Website prospects" /
"Outreach leads" tab toggle, and — on the Outreach tab — a 7-stage pipeline funnel
(New leads → Validated → Enriched → Scored → Contacted → Qualified → Nurture/
handoff) above the leads table. Mock data lives in `../mockLeads.ts`
(`MOCK_LEADS`, `MOCK_PROSPECTS`, `LEAD_PIPELINE`), ported field-for-field from the
reference build's `data/leads.ts` and `data/conversations.ts` (the prospects half).
Tab selection is real client state; both tables are still static. No hook, no
service call.

Registered the same way as `/agents` (see that page's doc for the nav/proxy/matcher
detail); also without a permission gate yet, pending the `lead` code.
