# Approvals

**Source:** `src/app/(restricted)/approvals/page.tsx`, view in
`components/ApprovalsListView.tsx` + `components/ApprovalDetailSheet.tsx`,
hooks in `hooks/`.

New top-level page (Sprint-1 gap closure, `apps.conversations`'s new
`Approval` model). An org-wide inbox for AI-proposed actions that need a
human sign-off before they run — today the only `category` is `outreach`
(a queued follow-up message; see `ConversationsListView`'s "Generate
follow-up" action). Mirrors `LeadsListView`'s list-page shape exactly
(`useApprovalsList.ts` follows `useLeadsList.ts`'s pattern: URL-namespaced
`useQueryParams`, client-known enum filter options since there's no
`?type=parameters` route here either).

`GET /api/v1/approvals/` (filterable by `status`/`category`/`agent_id` —
only `status` is exposed as a toolbar filter, matching `LeadsListView`'s
"omit filters with no cheap option-list source" convention) and
`GET /api/v1/approvals/{id}/` back the list and `ApprovalDetailSheet`.
`POST .../approve/` (no body) and `POST .../reject/` (`{rejection_reason}`,
a small RHF+Zod dialog — `RejectApprovalDialog.tsx`, first user of the new
`RHFTextareaField` primitive) both gate on `approval:manage`; viewing the
inbox only needs `approval:view`.

Route gated via `ROUTE_PERMISSIONS`'s `{ prefix: '/approvals', resources:
['approval'] }` and listed in `NAV_ITEMS`/`ENABLED_HREFS`/`proxy.ts`'s
`ENABLED_PREFIXES`, same three-list pattern every gated route follows.
