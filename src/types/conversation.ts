/**
 * Conversation DTOs — mirrors `apps/conversations/api/v1/serializers/conversations.py`
 * field for field. Names match the backend exactly (`snake_case`).
 */

/** Mirrors `ConversationStatus` in `apps/conversations/constants.py`. */
export type ConversationStatus =
  | 'open'
  | 'handoff_requested'
  | 'handoff_active'
  | 'resolved'
  | 'abandoned';

/** Mirrors `MessageRole` in `apps/conversations/constants.py`. */
export type MessageRole = 'visitor' | 'agent' | 'operator' | 'system';

/** Mirrors `ConfidenceDecision` in `apps/conversations/constants.py`. */
export type ConfidenceDecision = 'answered' | 'clarify' | 'fallback' | 'handoff';

/** Mirrors `EscalationReason` in `apps/conversations/constants.py`. */
export type EscalationReason =
  | 'visitor_requested'
  | 'low_confidence'
  | 'sensitive_topic'
  | 'self_harm_or_high_risk'
  | 'abuse'
  | 'tool_failure'
  | 'unsupported_language'
  | 'operator_initiated'
  | 'operator_claimed'
  | 'handoff_trigger_matched';

/** `POST /escalations/{id}/resolve/` response shape (backend 2026-09-15). */
export type Escalation = {
  id: string;
  reason: EscalationReason;
  created_at: string;
};

/**
 * `ConversationDetailSerializer.escalations` row (backend 2026-09-15) — the
 * full per-conversation history, unlike `active_escalation` below which only
 * ever shows the current unresolved one.
 */
export type EscalationHistoryEntry = Escalation & { resolved_at: string | null };

export type Citation = {
  id: string;
  source_title: string;
  source_url: string;
  excerpt: string;
  page_number: number | null;
};

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  confidence_decision: ConfidenceDecision | null;
  confidence_score: number | null;
  citations: Citation[];
  created_at: string;
  /** Which human sent this. Non-null only for `role: 'operator'` — the role
   * alone never said *which* operator replied (backend 2026-09-14). Never
   * present on the public widget payloads, only this operator-facing one. */
  sent_by_email: string | null;
};

/** Row shape from `GET /agents/{id}/conversations/` and `GET /conversations/`. */
export type ConversationListItem = {
  id: string;
  agent_id: string;
  status: ConversationStatus;
  language: string;
  assigned_operator_id: string | null;
  assigned_operator_email: string | null;
  /** The current unresolved escalation, if any (backend 2026-09-15). `null`
   * once resolved or if the conversation was never escalated. */
  active_escalation: Escalation | null;
  created_at: string;
  updated_at: string;
};

/** Full record from `GET /conversations/{id}/`. */
export type Conversation = ConversationListItem & {
  summary: string;
  messages: Message[];
  /** Every escalation this conversation has ever had, resolved or not
   * (backend 2026-09-15) — "why was this handed to a human" at handoff time. */
  escalations: EscalationHistoryEntry[];
};

/** `GET /agents/{id}/analytics/summary/?range=7d|30d|90d`. */
export type AnalyticsSummary = {
  conversation_count: number;
  message_count: number;
  escalation_count: number;
  lead_count: number;
  unresolved_topic_count: number;
};

export type AnalyticsRange = '7d' | '30d' | '90d';
