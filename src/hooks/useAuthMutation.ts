import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import axiosAuth from '@/client/axiosAuth';
import type { AxiosError, AxiosRequestConfig } from 'axios';

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

type MutationArgs<TBody> = {
  url: string;
  body?: TBody;
  method?: Method;
  config?: AxiosRequestConfig;
};

// Generic authenticated mutation wrapper around TanStack useMutation + axiosAuth.
// Mirrors useAuthQuery for the write side (plus on-demand GETs, e.g. blob downloads
// triggered by a button rather than rendered data). Caller passes { url, body, method }.
export function useAuthMutation<TData = unknown, TBody = unknown>(
  options?: Omit<UseMutationOptions<TData, AxiosError, MutationArgs<TBody>>, 'mutationFn'>
) {
  return useMutation<TData, AxiosError, MutationArgs<TBody>>({
    mutationFn: async ({ url, body, method = 'post', config }) => {
      if (method === 'get') {
        const { data } = await axiosAuth.get<TData>(url, config);
        return data;
      }
      if (method === 'delete') {
        // Axios's `.delete()` takes the body via `config.data`, not a second
        // positional argument — most DELETEs here target a resource id in the
        // URL and need no body, but the RBAC override endpoint identifies
        // what to remove by (user_id, permission_code) in the body instead.
        const { data } = await axiosAuth.delete<TData>(url, { ...config, data: body });
        return data;
      }
      const { data } = await axiosAuth[method]<TData>(url, body, config);
      return data;
    },
    ...options,
  });
}

type RawResponse<TData> = { data: TData; status: number; headers: Record<string, string> };

// Same as useAuthMutation, but resolves the full { data, status, headers } triple
// instead of just `data`. Use only when the caller needs to branch on HTTP status
// (e.g. a 202 "accepted, processing async" vs 200 "applied" distinction) or read a
// response header (e.g. Content-Disposition for a server-chosen filename) — most
// callers should use useAuthMutation instead.
export function useAuthMutationWithStatus<TData = unknown, TBody = unknown>(
  options?: Omit<
    UseMutationOptions<RawResponse<TData>, AxiosError, MutationArgs<TBody>>,
    'mutationFn'
  >
) {
  return useMutation<RawResponse<TData>, AxiosError, MutationArgs<TBody>>({
    mutationFn: async ({ url, body, method = 'post', config }) => {
      if (method === 'get') {
        const { data, status, headers } = await axiosAuth.get<TData>(url, config);
        return { data, status, headers: headers as Record<string, string> };
      }
      if (method === 'delete') {
        const { data, status, headers } = await axiosAuth.delete<TData>(url, config);
        return { data, status, headers: headers as Record<string, string> };
      }
      const { data, status, headers } = await axiosAuth[method]<TData>(url, body, config);
      return { data, status, headers: headers as Record<string, string> };
    },
    ...options,
  });
}
