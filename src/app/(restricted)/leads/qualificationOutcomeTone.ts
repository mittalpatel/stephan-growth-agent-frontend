import type { StatusTone } from '@/components/common/StatusBadge';
import type { QualificationOutcome } from '@/types/lead';

/**
 * One `QualificationOutcome` → badge-tone map, shared by the list table and
 * the detail sheet, for the same reason as `LEAD_STATUS_TONE` beside it.
 *
 * `unqualified` is `neutral` rather than `danger` on purpose: it is the
 * column's default for every lead captured by an agent with no rules
 * configured, so styling it as a failure would paint most of the table red
 * and say nothing. Being exhaustive over the union means a tier added
 * server-side fails the build here instead of rendering untoned.
 */
export const QUALIFICATION_OUTCOME_TONE: Record<QualificationOutcome, StatusTone> = {
  qualified: 'success',
  partial: 'warning',
  unqualified: 'neutral',
};
