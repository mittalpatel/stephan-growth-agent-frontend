import { describe, it, expect } from 'vitest';

import {
  agentAnalyticsSummaryEndpoint,
  agentConversationsEndpoint,
  analyticsSummaryKey,
  CONVERSATION_MESSAGES_PAGE_SIZE,
  conversationAssignEndpoint,
  conversationDetailEndpoint,
  conversationDetailKey,
  conversationGenerateFollowupEndpoint,
  conversationMessagesEndpoint,
  conversationMessagesKey,
  conversationMessageSendEndpoint,
  CONVERSATIONS_ENDPOINT,
  conversationsListKey,
  conversationsListUrl,
} from '../conversations';

const AGENT_ID = '0c2f6a1e-1111-4a2b-8c3d-4e5f60718293';
const CONVERSATION_ID = 'a1b2c3d4-2222-4a2b-8c3d-4e5f60718293';
const LIST_QUERY = {
  page: 1,
  limit: 20,
  search: [],
  search_by: '',
  sort: 'created_at',
  sort_direction: 'desc' as const,
  filter: [],
  filter_by: '',
};

describe('conversation endpoints', () => {
  it('nests the list and analytics reads under the agent', () => {
    expect(agentConversationsEndpoint(AGENT_ID)).toBe(`/api/v1/agents/${AGENT_ID}/conversations/`);
    expect(agentAnalyticsSummaryEndpoint(AGENT_ID)).toBe(
      `/api/v1/agents/${AGENT_ID}/analytics/summary/`
    );
  });

  it('keeps the per-conversation routes off the agent prefix', () => {
    expect(conversationDetailEndpoint(CONVERSATION_ID)).toBe(
      `/api/v1/conversations/${CONVERSATION_ID}/`
    );
    expect(conversationAssignEndpoint(CONVERSATION_ID)).toBe(
      `/api/v1/conversations/${CONVERSATION_ID}/assign/`
    );
    expect(conversationGenerateFollowupEndpoint(CONVERSATION_ID)).toBe(
      `/api/v1/conversations/${CONVERSATION_ID}/generate-followup/`
    );
  });

  // The detail response embeds only the first `DETAIL_INLINE_MESSAGE_LIMIT`
  // messages, so a transcript longer than that is unreadable without this
  // route. It went unwired for a while precisely because nothing asserted it.
  it('exposes the paginated message history route', () => {
    expect(conversationMessagesEndpoint(CONVERSATION_ID)).toBe(
      `/api/v1/conversations/${CONVERSATION_ID}/messages/`
    );
  });

  // Must not exceed the backend's `DefaultPagination.max_page_size`, which
  // clamps silently rather than erroring.
  it('requests a transcript page no larger than the backend allows', () => {
    expect(CONVERSATION_MESSAGES_PAGE_SIZE).toBeLessThanOrEqual(100);
  });

  // The operator's own write path is a different route from the `GET` it sits
  // next to, and needs a stronger permission, so posting to the read route
  // would 405 rather than fail loudly at the point the mistake was made.
  it('separates the operator send route from the message list route', () => {
    expect(conversationMessageSendEndpoint(CONVERSATION_ID)).toBe(
      `/api/v1/conversations/${CONVERSATION_ID}/messages/send/`
    );
    expect(conversationMessageSendEndpoint(CONVERSATION_ID)).not.toBe(
      conversationMessagesEndpoint(CONVERSATION_ID)
    );
  });

  // `null` means "every agent", which is a different read from any one
  // agent's — collapsing the two would serve one agent's rows as the org-wide
  // queue, or the reverse.
  it('reads the org-wide list off its own route and cache slot', () => {
    expect(conversationsListUrl(null, LIST_QUERY).startsWith(CONVERSATIONS_ENDPOINT)).toBe(true);
    expect(
      conversationsListUrl(AGENT_ID, LIST_QUERY).startsWith(agentConversationsEndpoint(AGENT_ID))
    ).toBe(true);
    expect(conversationsListKey(null)).not.toEqual(conversationsListKey(AGENT_ID));
  });

  it('builds distinct, id-scoped query keys', () => {
    expect(conversationsListKey(AGENT_ID)).toEqual(['conversations-list', AGENT_ID]);
    expect(conversationDetailKey(CONVERSATION_ID)).toEqual([
      'conversation-detail',
      CONVERSATION_ID,
    ]);
    expect(analyticsSummaryKey(AGENT_ID, '7d')).toEqual(['analytics-summary', AGENT_ID, '7d']);
  });

  // Paged separately so one page's cache entry never overwrites another's.
  it('namespaces transcript pages by page number', () => {
    expect(conversationMessagesKey(CONVERSATION_ID, 2)).toEqual([
      'conversation-messages',
      CONVERSATION_ID,
      2,
    ]);
    expect(conversationMessagesKey(CONVERSATION_ID, 2)).not.toEqual(
      conversationMessagesKey(CONVERSATION_ID, 3)
    );
  });
});
