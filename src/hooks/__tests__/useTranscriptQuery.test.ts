import { describe, it, expect } from 'vitest';

import { flattenTranscript, olderPageParam } from '@/hooks/useTranscriptQuery';
import type { ApiResponse } from '@/types/api';
import type { Message } from '@/types/conversation';

function message(id: string): Message {
  return {
    id,
    role: 'visitor',
    content: id,
    confidence_decision: null,
    confidence_score: null,
    citations: [],
    created_at: '2026-01-01T00:00:00Z',
  };
}

function page(currentPage: number, ids: string[], totalPages = 3): ApiResponse<Message[]> {
  return {
    success: true,
    message: null,
    data: ids.map(message),
    meta: {
      count: 0,
      total_pages: totalPages,
      current_page: currentPage,
      page_size: 50,
      next: null,
      previous: null,
    },
    errors: null,
  };
}

describe('olderPageParam', () => {
  // The transcript is the only list in the app that pages backwards: it opens
  // on `?page=last` and walks down. Getting the direction wrong would load the
  // same page forever or skip straight past the start of the conversation.
  it('steps to the page before the one just loaded', () => {
    expect(olderPageParam(page(3, []))).toBe(2);
    expect(olderPageParam(page(2, []))).toBe(1);
  });

  it('stops once page 1 has been loaded', () => {
    expect(olderPageParam(page(1, []))).toBeUndefined();
  });
});

describe('flattenTranscript', () => {
  it('returns nothing for no pages', () => {
    expect(flattenTranscript([])).toEqual([]);
  });

  // Each page is oldest-first internally, but the pages themselves arrive
  // newest-first. Only reversing the pages (not the rows) restores real order.
  it('orders oldest to newest across pages loaded newest-first', () => {
    const pages = [page(3, ['e', 'f']), page(2, ['c', 'd']), page(1, ['a', 'b'])];

    expect(flattenTranscript(pages).map((m) => m.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('keeps a single page in the order the server sent it', () => {
    expect(flattenTranscript([page(1, ['a', 'b', 'c'])]).map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });
});
