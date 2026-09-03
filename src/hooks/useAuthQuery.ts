import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import axiosAuth from '@/client/axiosAuth';
import type { AxiosError } from 'axios';

export function useAuthQuery<TQueryFnData = unknown, TData = TQueryFnData>(
  queryKey: unknown[],
  url: string,
  options?: Omit<UseQueryOptions<TQueryFnData, AxiosError, TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TQueryFnData, AxiosError, TData>({
    queryKey,
    // Forward TanStack's AbortSignal to axios so a request that goes stale (key change)
    // or whose component unmounts is cancelled in-flight — saves bandwidth and avoids
    // resolving against a gone consumer.
    queryFn: async ({ signal }) => {
      const { data } = await axiosAuth.get<TQueryFnData>(url, { signal });
      return data;
    },
    ...options,
  });
}
