/**
 * Approval endpoints and query keys. Same shape as `src/services/leads.ts`.
 */
import { buildListParams, type ListQuery } from './listParams';

export const APPROVALS_ENDPOINT = '/api/v1/approvals/';
export const approvalDetailEndpoint = (id: string) => `${APPROVALS_ENDPOINT}${id}/`;
export const approvalApproveEndpoint = (id: string) => `${APPROVALS_ENDPOINT}${id}/approve/`;
export const approvalRejectEndpoint = (id: string) => `${APPROVALS_ENDPOINT}${id}/reject/`;

export const APPROVALS_LIST_KEY = 'approvals-list';
export const approvalDetailKey = (id: string) => ['approval-detail', id];

export type ApprovalListQuery = ListQuery;
export const buildApprovalListParams = buildListParams;

export function approvalsListUrl(query: ApprovalListQuery): string {
  const search = new URLSearchParams(
    Object.entries(buildApprovalListParams(query)).map(([key, value]) => [key, String(value)])
  );
  return `${APPROVALS_ENDPOINT}?${search.toString()}`;
}

export const APPROVAL_STATUS_VALUES = ['pending', 'approved', 'rejected'] as const;
export const APPROVAL_CATEGORY_VALUES = ['outreach'] as const;
