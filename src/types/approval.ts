/**
 * Approval DTOs — mirrors `apps/conversations/api/v1/serializers/approvals.py`
 * field for field.
 */

export type ApprovalCategory = 'outreach';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalRisk = 'low' | 'medium' | 'high';

/** Row shape from `GET /api/v1/approvals/`. */
export type ApprovalListItem = {
  id: string;
  agent_id: string;
  conversation_id: string;
  lead_id: string | null;
  category: ApprovalCategory;
  title: string;
  risk: ApprovalRisk;
  status: ApprovalStatus;
  reviewed_by_id: string | null;
  reviewed_at: string | null;
  created_at: string;
};

/** Full record from `GET /api/v1/approvals/{id}/`. */
export type Approval = ApprovalListItem & {
  ai_action: string;
  reason: string;
  preview: string;
  rejection_reason: string | null;
};
