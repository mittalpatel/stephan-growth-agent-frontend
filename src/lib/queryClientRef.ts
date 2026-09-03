import type { QueryClient } from '@tanstack/react-query';

/**
 * Module-level handle to the app's single `QueryClient` instance, set once by
 * `QueryProvider` on mount.
 *
 * `axiosAuth.ts`'s refresh-failure logout path runs outside the React tree
 * (it's an axios interceptor, not a component) and has no other way to reach
 * the query client to clear cached responses before signing out. Consumers
 * must tolerate `null` — e.g. a logout triggered before the provider has
 * mounted, which shouldn't happen in practice but costs nothing to guard.
 */
let queryClientRef: QueryClient | null = null;

export function setQueryClientRef(client: QueryClient): void {
  queryClientRef = client;
}

export function clearQueryCache(): void {
  queryClientRef?.clear();
}
