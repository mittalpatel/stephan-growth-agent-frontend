/**
 * Conversation endpoints and query keys. Same shape as `src/services/agents.ts`.
 *
 * List/detail reads are deliberately never cache-busted here beyond React
 * Query's own cache — the backend itself serves them uncached (see the
 * module docstring on `apps.conversations.api.v1.views.conversations`), so
 * this app relies on manual refetch, not a stale-while-revalidate window.
 */
import { buildListParams, type ListQuery } from './listParams';

export const agentConversationsEndpoint = (agentId: string) =>
  `/api/v1/agents/${agentId}/conversations/`;
/**
 * Every conversation across every agent in the organization (backend
 * 2026-09-14, `ConversationListView`). Same filter/sort contract as the
 * agent-scoped listing above, just not narrowed to one agent — this is what
 * makes an org-wide "which conversations need a human right now" queue one
 * request instead of one per agent.
 */
export const CONVERSATIONS_ENDPOINT = '/api/v1/conversations/';
export const agentAnalyticsSummaryEndpoint = (agentId: string) =>
  `/api/v1/agents/${agentId}/analytics/summary/`;
export const conversationDetailEndpoint = (conversationId: string) =>
  `/api/v1/conversations/${conversationId}/`;
/**
 * Paginated message history. `GET /conversations/{id}/` embeds only the first
 * `DETAIL_INLINE_MESSAGE_LIMIT` messages (backend
 * `ConversationSelector.get_conversation`), so this is the only way to read a
 * transcript longer than that.
 */
export const conversationMessagesEndpoint = (conversationId: string) =>
  `/api/v1/conversations/${conversationId}/messages/`;
/**
 * A human operator's own reply into a conversation (backend 2026-09-14,
 * `ConversationMessageSendView`, `conversation:manage`). Deliberately a
 * different path from the `GET` above, which only needs `conversation:view`.
 */
export const conversationMessageSendEndpoint = (conversationId: string) =>
  `/api/v1/conversations/${conversationId}/messages/send/`;
export const conversationAssignEndpoint = (conversationId: string) =>
  `/api/v1/conversations/${conversationId}/assign/`;
export const conversationGenerateFollowupEndpoint = (conversationId: string) =>
  `/api/v1/conversations/${conversationId}/generate-followup/`;
/**
 * Explicit control transfer between the AI and a human (backend 2026-09-15).
 * Claim assigns the caller and moves the conversation to `handoff_active`;
 * release returns it to `open`; resolve closes it. Each returns the full
 * updated conversation.
 */
export const conversationHandoffClaimEndpoint = (conversationId: string) =>
  `/api/v1/conversations/${conversationId}/handoff/claim/`;
export const conversationHandoffReleaseEndpoint = (conversationId: string) =>
  `/api/v1/conversations/${conversationId}/handoff/release/`;
export const conversationResolveEndpoint = (conversationId: string) =>
  `/api/v1/conversations/${conversationId}/resolve/`;

export const CONVERSATIONS_LIST_KEY = 'conversations-list';
/** `null` is the org-wide listing, not a missing id, so it needs a cache slot
 * of its own rather than collapsing into any one agent's. */
export const conversationsListKey = (agentId: string | null) => [
  CONVERSATIONS_LIST_KEY,
  agentId ?? 'all-agents',
];
export const conversationDetailKey = (conversationId: string) => [
  'conversation-detail',
  conversationId,
];
export const conversationMessagesKey = (conversationId: string, page: number) => [
  'conversation-messages',
  conversationId,
  page,
];
/** Every loaded transcript page for one conversation, for invalidation. */
export const conversationMessagesPrefixKey = (conversationId: string) => [
  'conversation-messages',
  conversationId,
];

/**
 * One transcript page. Messages are ordered oldest-first server-side
 * (`Message.Meta.ordering`), so the newest live on the *last* page, which is
 * what `?page=last` resolves to (DRF `PageNumberPagination.last_page_strings`).
 */
export const CONVERSATION_MESSAGES_PAGE_SIZE = 50;
export const analyticsSummaryKey = (agentId: string, range: string) => [
  'analytics-summary',
  agentId,
  range,
];

/**
 * `has_escalation` (backend 2026-09-16) is read as its own top-level query
 * param by `ConversationSelector._apply_list_filters` — it is the first
 * `"boolean"`-typed filter in this codebase and is **not** routed through the
 * generic `filter`/`filter_by` column contract the way every `multi_select`
 * filter is, so it can't be folded into `buildListParams`.
 */
export type ConversationListQuery = ListQuery & { has_escalation?: 'true' | 'false' };
export const buildConversationListParams = buildListParams;

/** `agentId: null` reads the org-wide listing instead of one agent's. */
export function conversationsListUrl(agentId: string | null, query: ConversationListQuery): string {
  const search = new URLSearchParams(
    Object.entries(buildConversationListParams(query)).map(([key, value]) => [key, String(value)])
  );
  if (query.has_escalation) {
    search.set('has_escalation', query.has_escalation);
  }
  const base = agentId === null ? CONVERSATIONS_ENDPOINT : agentConversationsEndpoint(agentId);
  return `${base}?${search.toString()}`;
}

/**
 * The `status` values `ConversationSelector._FILTER_FIELDS` accepts.
 * `AgentConversationListView` never wires up a `?type=parameters` route
 * (same gap as `apps.knowledge`'s source list — see `src/services/knowledge.ts`),
 * so `useConversationsList` builds its `FilterConfig[]` from this value list
 * plus locale labels rather than fetching them.
 */
export const CONVERSATION_STATUS_VALUES = [
  'open',
  'handoff_requested',
  'handoff_active',
  'resolved',
  'abandoned',
] as const;
