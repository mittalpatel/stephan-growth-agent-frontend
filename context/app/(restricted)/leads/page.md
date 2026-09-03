# Leads (Sprint 1 static preview)

**Source:** `src/app/(restricted)/leads/page.tsx`, view in
`components/LeadsListView.tsx`

A static preview of `frontend-plan-v3.md` §3.1's leads list. Renders `MOCK_LEADS`
(inline, typed) — name, email, agent, status, captured — with a `PreviewBanner`. No
hook, no service call.

Registered the same way as `/agents` (see that page's doc for the nav/proxy/matcher
detail); also without a permission gate yet, pending the `lead` code.
