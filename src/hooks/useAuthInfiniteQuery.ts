import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import axiosAuth from '@/client/axiosAuth';
import type { AxiosError } from 'axios';

/**
 * `useAuthQuery`'s accumulating sibling, for a list read whose pages are meant
 * to stack in the UI rather than replace each other.
 *
 * Use it only where accumulation is the point (a chat transcript loading older
 * messages). An ordinary list screen keeps its page in the URL via
 * `useQueryParams` and renders one page at a time, which stays linkable and
 * restores on back-navigation. This hook's state is deliberately local, so a
 * screen built on it is not.
 *
 * `buildUrl` receives the page param rather than a plain `url` string, since
 * every page is a different request. Resetting is free: a changed `queryKey`
 * discards the accumulated pages, so callers key on the id they are paging.
 */
export function useAuthInfiniteQuery<TPage, TPageParam>(
  queryKey: unknown[],
  buildUrl: (pageParam: TPageParam) => string,
  options: {
    initialPageParam: TPageParam;
    getNextPageParam: (lastPage: TPage) => TPageParam | undefined;
  } & Omit<
    UseInfiniteQueryOptions<TPage, AxiosError, InfiniteData<TPage>, unknown[], TPageParam>,
    'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'
  >
) {
  const { initialPageParam, getNextPageParam, ...rest } = options;

  return useInfiniteQuery<TPage, AxiosError, InfiniteData<TPage>, unknown[], TPageParam>({
    queryKey,
    // Same AbortSignal forwarding as `useAuthQuery`: a page request that goes
    // stale (key change) or whose component unmounts is cancelled in-flight.
    // `QueryFunctionContext` types `pageParam` through a conditional on
    // `TPageParam`, which stays deferred (and so widens to `unknown`) while
    // `TPageParam` is still generic here. The cast is safe because
    // `initialPageParam` and `getNextPageParam` below are the only producers of
    // this value and both are typed `TPageParam`; it is confined to this line
    // rather than loosening the hook's public signature.
    queryFn: async ({ pageParam, signal }) => {
      const { data } = await axiosAuth.get<TPage>(buildUrl(pageParam as TPageParam), { signal });
      return data;
    },
    initialPageParam,
    getNextPageParam,
    ...rest,
  });
}
