'use client';

import { useTranscriptQuery } from '@/hooks/useTranscriptQuery';
import {
  conversationMessagesEndpoint,
  conversationMessagesPrefixKey,
} from '@/services/conversations';

/**
 * The full transcript of one conversation, newest page first and older pages
 * loaded on demand.
 *
 * `GET /conversations/{id}/` embeds only the first
 * `DETAIL_INLINE_MESSAGE_LIMIT` (50) messages, and because
 * `Message.Meta.ordering` is ascending, that inline slice is the *oldest* 50,
 * not the most recent. On any conversation past 50 messages the detail
 * response therefore omits exactly the part an operator needs most: the end.
 * This hook reads the paginated `/messages/` endpoint instead, so the
 * transcript is always complete and always opens on the latest turn.
 *
 * The paging itself lives in `useTranscriptQuery`, shared with the leads
 * sheet's read of the same contract through a differently authorized endpoint.
 */
export function useConversationMessages(
  conversationId: string | null,
  { live = false }: { live?: boolean } = {}
) {
  return useTranscriptQuery(
    conversationMessagesPrefixKey(conversationId ?? ''),
    conversationMessagesEndpoint(conversationId ?? ''),
    { live, enabled: Boolean(conversationId) }
  );
}
