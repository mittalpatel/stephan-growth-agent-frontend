import type { StatusTone } from '@/components/common/StatusBadge';
import type { LeadStatus } from '@/types/lead';

/**
 * One `LeadStatus` → badge-tone map, shared by the list table and the detail
 * sheet. Extracted the moment the second consumer appeared: two copies drift,
 * and a lead reading "danger" in one place and "neutral" in the other is the
 * kind of inconsistency nobody notices until a screenshot.
 */
export const LEAD_STATUS_TONE: Record<LeadStatus, StatusTone> = {
  new: 'neutral',
  contacted: 'info',
  qualified: 'success',
  disqualified: 'danger',
};
