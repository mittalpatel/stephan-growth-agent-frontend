'use client';

import { useAuthInfiniteQuery } from '@/hooks/useAuthInfiniteQuery';
import { CONVERSATION_MESSAGES_PAGE_SIZE } from '@/services/conversations';
import type { ApiResponse } from '@/types/api';
import type { Message } from '@/types/conversation';

type MessagePage = ApiResponse<Message[]>;

/** Poll cadence while a conversation is in a handoff state. Matches the
 * backend widget stream's own server-side poll interval, so an operator and
 * the visitor see each other's messages on comparable delays. */
const LIVE_REFETCH_MS = 5000;

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
 * One conversation's transcript, newest page first and older pages loaded on
 * demand — the shared engine behind every screen that reads a message history.
 *
 * Two endpoints serve the identical contract (same `MessageSerializer`, same
 * oldest-first ordering, same `?page=last` support), differing only in URL and
 * authorization: `GET /conversations/{id}/messages/` (`conversation:view`) and
 * `GET /leads/{id}/conversation/messages/` (`lead:view`, backend 2026-09-16).
 * They are parameterized here rather than duplicated, but keep **separate
 * query keys** — same rows, different authorization, so they must not share a
 * cache entry.
 *
 * Paging walks backwards from `?page=last`. The endpoints order oldest-first,
 * so the newest messages are on the final page; `last` is resolved server-side
 * by DRF's `PageNumberPagination.last_page_strings`, which means the first
 * render costs one request and never needs a count round trip to find the end.
 * "Next page" here therefore means the page *before* the one just loaded.
 */
export function useTranscriptQuery(
  queryKey: unknown[],
  endpoint: string,
  { live = false, enabled = true }: { live?: boolean; enabled?: boolean } = {}
) {
  const query = useAuthInfiniteQuery<MessagePage, number | 'last'>(
    queryKey,
    (pageParam) => `${endpoint}?page=${pageParam}&page_size=${CONVERSATION_MESSAGES_PAGE_SIZE}`,
    {
      initialPageParam: 'last',
      // Walking backwards: stop once the page just loaded was page 1. The
      // server resolves `last` to a real number in `meta.current_page`, so the
      // first response is what tells us where we started.
      getNextPageParam: olderPageParam,
      enabled,
      // While a human is actually handling this conversation, the operator is
      // waiting on the visitor's next message with nothing to trigger a
      // refetch. The visitor's own widget gets a real SSE stream; the operator
      // side has no push channel yet (backend deferred it), so this polls
      // instead, and only in the state where someone is sitting on the screen
      // waiting. `refetchInterval` on an infinite query refetches every loaded
      // page, which is what keeps an older page from going stale mid-handoff.
      refetchInterval: live ? LIVE_REFETCH_MS : false,
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

/** The prop bag `ConversationTranscript` consumes. */
export type TranscriptState = ReturnType<typeof useTranscriptQuery>;
