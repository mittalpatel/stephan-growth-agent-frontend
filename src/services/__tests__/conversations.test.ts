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
  conversationsListKey,
} from '../conversations';

const AGENT_ID = '0c2f6a1e-1111-4a2b-8c3d-4e5f60718293';
const CONVERSATION_ID = 'a1b2c3d4-2222-4a2b-8c3d-4e5f60718293';

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
