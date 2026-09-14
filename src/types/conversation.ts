/**
 * Conversation DTOs — mirrors `apps/conversations/api/v1/serializers/conversations.py`
 * field for field. Names match the backend exactly (`snake_case`).
 *
 * `Escalation` is intentionally not modeled beyond its enum values: the
 * backend never returns escalation rows to the operator UI (no list/detail
 * endpoint reads them — only `POST /escalations/{id}/resolve/`, which needs
 * an id this app has no way to discover). See
 * `context/app/(restricted)/conversations/page.md` for the gap writeup.
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
  created_at: string;
  updated_at: string;
};

/** Full record from `GET /conversations/{id}/`. */
export type Conversation = ConversationListItem & {
  summary: string;
  messages: Message[];
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
