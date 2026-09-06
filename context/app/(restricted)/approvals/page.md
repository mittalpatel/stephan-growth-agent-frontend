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

Approve and reject report errors differently, on purpose. Approve is
fire-and-forget, so it toasts from `onError` and uses `mutate`. Reject is
awaited by its dialog (which closes only on success) and therefore carries no
`onError` at all: the dialog's `catch` → `applyApiError` is the single error
surface, so a failure produces one toast rather than two. That split is the
rule to follow for any action added here later.

Filtering and sorting match `ApprovalSelector` exactly: `status` is the one
toolbar filter (the selector also accepts `category`, which has a single
possible value today, and `agent_id`, which has no cheap option-list source
here), and sorting offers `created_at`/`status`. The selector also allows
`updated_at`, left out because no column shows it and a sort with no visible
effect reads as a bug.

Route gated via `ROUTE_PERMISSIONS`'s `{ prefix: '/approvals', resources:
['approval'] }` and listed in `NAV_ITEMS`/`ENABLED_HREFS`/`proxy.ts`'s
`ENABLED_PREFIXES`, same three-list pattern every gated route follows.
