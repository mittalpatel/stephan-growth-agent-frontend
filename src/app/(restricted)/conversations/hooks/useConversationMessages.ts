'use client';

import { useAuthInfiniteQuery } from '@/hooks/useAuthInfiniteQuery';
import {
  CONVERSATION_MESSAGES_PAGE_SIZE,
  conversationMessagesEndpoint,
} from '@/services/conversations';
import type { ApiResponse } from '@/types/api';
import type { Message } from '@/types/conversation';

type MessagePage = ApiResponse<Message[]>;

/**
 * The page to load when the operator asks for earlier messages: the one before
 * whichever page was loaded last, or `undefined` once page 1 has been reached.
 *
 * Exported for its own test because the direction is the easy thing to get
 * wrong. Paging runs *backwards* here, unlike every other list in the app.
 */
export function olderPageParam(lastPage: MessagePage): number | undefined {
  return lastPage.meta.current_page > 1 ? lastPage.meta.current_page - 1 : undefined;
}

/**
 * Accumulated pages to one chronological transcript.
 *
 * Pages arrive newest-first (`last`, `last - 1`, ...) because paging walks
 * backwards, while each page's own rows are oldest-first. Reversing the pages
 * and then flattening is what puts the whole transcript back in order.
 */
export function flattenTranscript(pages: readonly MessagePage[]): Message[] {
  return [...pages].reverse().flatMap((page) => page.data);
}

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
 * Paging walks backwards from `?page=last`. The endpoint orders oldest-first,
 * so the newest messages are on the final page; `last` is resolved server-side
 * by DRF's `PageNumberPagination.last_page_strings`, which means the first
 * render costs one request and never needs a count round trip to find the end.
 * "Next page" here therefore means the page *before* the one just loaded.
 */
export function useConversationMessages(conversationId: string | null) {
  const query = useAuthInfiniteQuery<MessagePage, number | 'last'>(
    ['conversation-messages', conversationId ?? ''],
    (pageParam) =>
      `${conversationMessagesEndpoint(conversationId ?? '')}?page=${pageParam}&page_size=${CONVERSATION_MESSAGES_PAGE_SIZE}`,
    {
      initialPageParam: 'last',
      // Walking backwards: stop once the page just loaded was page 1. The
      // server resolves `last` to a real number in `meta.current_page`, so the
      // first response is what tells us where we started.
      getNextPageParam: olderPageParam,
      enabled: Boolean(conversationId),
    }
  );

  const messages = flattenTranscript(query.data?.pages ?? []);

  const newestPage = query.data?.pages[0];

  return {
    messages,
    /** Total messages on the server, not just the ones loaded so far. */
    total: newestPage?.meta.count ?? messages.length,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,

    hasOlder: query.hasNextPage,
    loadOlder: () => void query.fetchNextPage(),
    isLoadingOlder: query.isFetchingNextPage,
  };
}
