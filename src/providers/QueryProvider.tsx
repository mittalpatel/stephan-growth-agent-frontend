'use client';

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { signOut } from 'next-auth/react';
import * as Sentry from '@sentry/nextjs';
import { toast } from 'sonner';
import { useState } from 'react';
import { rateLimitMessage } from '@/lib/apiError';
import { setQueryClientRef } from '@/lib/queryClientRef';

function status(error: unknown): number | undefined {
  return (error as { response?: { status: number } })?.response?.status;
}

// Expected control-flow responses that should not be logged to Sentry as errors:
// 401 (auth expiry → sign-out) and 429 (backend throttling → user-facing notice).
const EXPECTED_STATUSES = new Set([401, 429]);

// Report a failed request to Sentry, except the expected control-flow statuses
// above which are handled explicitly rather than logged as exceptions.
function reportDataError(error: unknown) {
  if (!EXPECTED_STATUSES.has(status(error) ?? 0)) Sentry.captureException(error);
}

export default function QueryProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(() => {
    // Guard so a burst of concurrent 401s triggers exactly one sign-out, not one
    // per failing query. The retry predicate stays pure (no side effects).
    let signingOut = false;
    // The onError closure below references `client` by name from inside the
    // QueryClient constructor call that assigns it — that's fine (not a
    // circular access) because the closure only actually runs later, once a
    // query fails, by which point `client` is long since assigned.
    const client: QueryClient = new QueryClient({
      queryCache: new QueryCache({
        onError: (error) => {
          if (status(error) === 401 && !signingOut) {
            signingOut = true;
            // Explicit — don't rely on signOut's full-page navigation to
            // incidentally wipe cached responses (projects, profile,
            // permissions) past logout.
            client.clear();
            signOut({ redirect: true, callbackUrl: '/login' });
            return;
          }
          // Throttled by the backend: surface one notice per burst instead of a
          // toast per failing query.
          if (status(error) === 429) {
            toast.error(rateLimitMessage(error), { id: 'rate-limited' });
            return;
          }
          reportDataError(error);
        },
      }),
      mutationCache: new MutationCache({
        onError: reportDataError,
      }),
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          retry: (failureCount, error) => {
            // Don't retry auth expiry (401) or throttling (429): retrying a 429
            // just hammers an already rate-limited endpoint. Let it surface.
            const s = status(error);
            if (s === 401 || s === 429) return false;
            return failureCount < 2;
          },
        },
      },
    });
    // axiosAuth.ts's refresh-failure logout path is outside the React tree and
    // has no other way to reach this instance — see src/lib/queryClientRef.ts.
    setQueryClientRef(client);
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
