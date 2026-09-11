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
export const conversationAssignEndpoint = (conversationId: string) =>
  `/api/v1/conversations/${conversationId}/assign/`;
export const conversationGenerateFollowupEndpoint = (conversationId: string) =>
  `/api/v1/conversations/${conversationId}/generate-followup/`;

export const CONVERSATIONS_LIST_KEY = 'conversations-list';
export const conversationsListKey = (agentId: string) => [CONVERSATIONS_LIST_KEY, agentId];
export const conversationDetailKey = (conversationId: string) => [
  'conversation-detail',
  conversationId,
];
export const conversationMessagesKey = (conversationId: string, page: number) => [
  'conversation-messages',
  conversationId,
  page,
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

export type ConversationListQuery = ListQuery;
export const buildConversationListParams = buildListParams;

export function conversationsListUrl(agentId: string, query: ConversationListQuery): string {
  const search = new URLSearchParams(
    Object.entries(buildConversationListParams(query)).map(([key, value]) => [key, String(value)])
  );
  return `${agentConversationsEndpoint(agentId)}?${search.toString()}`;
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
