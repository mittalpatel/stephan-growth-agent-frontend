/**
 * Lead DTOs — mirrors `apps/leads/api/v1/serializers/leads.py` field for
 * field. Names match the backend exactly (`snake_case`).
 */

/** Mirrors `LeadStatus` in `apps/leads/constants.py`. */
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'disqualified' | 'won';

/**
 * Mirrors `QualificationOutcome` in `apps/leads/constants.py`.
 *
 * Deliberately separate from `LeadStatus`, and the backend says why: `status`
 * is the operator-owned workflow state set by hand through
 * `PATCH /leads/{id}/status/`, while this is the system's own judgment from
 * the agent version's qualification rules. Both can read "qualified" and mean
 * different things, so never render one in place of the other.
 */
export type QualificationOutcome = 'qualified' | 'partial' | 'unqualified';

/** Row shape from `GET /api/v1/leads/`. */
export type LeadListItem = {
  id: string;
  agent_id: string;
  conversation_id: string | null;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  qualification_outcome: QualificationOutcome;
  consent_given: boolean;
  created_at: string;
};

export type LeadField = {
  field_name: string;
  purpose: string;
  collected_at: string;
};

export type LeadConversationSummary = {
  id: string;
  status: string;
  created_at: string;
};

/**
 * One immutable evaluation of a lead against the qualification rules that
 * were active at the time. Append-only server-side: a returning visitor who
 * fills in a previously-blank field is re-evaluated and gets a new row rather
 * than overwriting the last one, so this reads as a history.
 *
 * `score` is a raw point total, not a percentage, and
 * `QualificationResultSerializer` deliberately omits the `rule_snapshot` the
 * points were counted against, so there is no denominator to turn it into
 * one. Render the number as-is.
 */
export type QualificationResult = {
  outcome: QualificationOutcome;
  score: number;
  missing_required_fields: string[];
  created_at: string;
};

/** Full record from `GET /api/v1/leads/{id}/`. */
export type Lead = LeadListItem & {
  interest_note: string;
  /** Backend 2026-09-17: the AI's own reason for suggesting capture. Blank
   * when the model never called `capture_lead` (e.g. a trigger-phrase match). */
  reason: string;
  consent_notice_version: string;
  fields: LeadField[];
  conversation: LeadConversationSummary | null;
  /** Newest first, per `QualificationResult.Meta.ordering`. */
  qualification_results: QualificationResult[];
  /** Backend 2026-09-18: when the lead-captured email notification was last
   * handed to the mail queue, not a delivery confirmation. Null until then.
   * Detail-only: never on `LeadListItem`, never filterable/sortable. */
  notified_at: string | null;
};
