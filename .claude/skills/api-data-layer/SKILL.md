---
name: api-data-layer
description: Guides API integration and data fetching for this project. Use when setting up Axios client, writing service functions, using TanStack Query (useQuery, useMutation), deciding on caching strategy, handling API errors, adding request interceptors, or asking "how do I fetch data", "how do I call an API", "where do I put my service", "how do I cache this".
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# API & Data Layer — Senior Frontend Guidelines

## Architecture

```
Page / Component
      ↓ calls
useXxxQuery / useMutation  (TanStack Query hook in src/lib/hooks/ or feature folder)
      ↓ calls
Service function           (src/services/xxx.service.ts)
      ↓ calls
apiClient                  (src/lib/api/client.ts — Axios instance)
      ↓
Django REST Framework backend
```

Never call `apiClient` directly from a component. Always go through the service layer.

---

## 1. Axios Client (src/lib/api/client.ts)

```typescript
import axios from 'axios';
import { getSession } from 'next-auth/react';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach bearer token
apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Response interceptor — normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired — trigger refresh or redirect
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 2. Service Layer Pattern (src/services/)

```typescript
// services/campaigns.service.ts
import { apiClient } from '@/lib/api/client';
import type { Campaign, CreateCampaignDto } from '@/types/campaigns';

export const campaignsService = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<Campaign[]>('/api/campaigns/', { params }).then((r) => r.data),

  getById: (id: string) => apiClient.get<Campaign>(`/api/campaigns/${id}/`).then((r) => r.data),

  create: (dto: CreateCampaignDto) =>
    apiClient.post<Campaign>('/api/campaigns/', dto).then((r) => r.data),

  update: (id: string, dto: Partial<CreateCampaignDto>) =>
    apiClient.patch<Campaign>(`/api/campaigns/${id}/`, dto).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/api/campaigns/${id}/`),
};
```

---

## 3. TanStack Query Hooks

### Query (read)

```typescript
// lib/hooks/use-campaigns.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsService } from '@/services/campaigns.service';

export const campaignKeys = {
  all: ['campaigns'] as const,
  list: (filters?: unknown) => [...campaignKeys.all, 'list', filters] as const,
  detail: (id: string) => [...campaignKeys.all, 'detail', id] as const,
};

export function useCampaigns(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: campaignKeys.list(filters),
    queryFn: () => campaignsService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
```

### Mutation (write) with optimistic update

```typescript
export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) =>
      campaignsService.update(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(campaignKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
}
```

---

## 4. Data Fetching in Server Components

Use `fetch` with explicit caching in Server Components; do not use Axios on the server.

```typescript
// app/(dashboard)/campaigns/page.tsx — Server Component
export default async function CampaignsPage() {
  // Parallel fetching — never sequential/waterfall
  const [campaigns, stats] = await Promise.all([
    fetch(`${process.env.BACKEND_URL}/api/campaigns/`, {
      cache: 'no-store',                        // user data — never cache
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()),
    fetch(`${process.env.BACKEND_URL}/api/stats/`, {
      next: { revalidate: 300 },                // semi-static — 5 min ISR
    }).then(r => r.json()),
  ])

  return <CampaignsContainer initialData={campaigns} stats={stats} />
}
```

### Caching quick reference

| Data                     | Strategy                                             |
| ------------------------ | ---------------------------------------------------- |
| User-specific data       | `cache: 'no-store'`                                  |
| Blog / docs / static     | `cache: 'force-cache'`                               |
| Widget / dashboard stats | `next: { revalidate: 300 }`                          |
| Content updated on save  | `next: { tags: ['widget-123'] }` + `revalidateTag()` |

---

## 5. Error Handling

```typescript
// services must never swallow errors — let them propagate
// hooks surface errors via TanStack Query's error state
export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignsService.getById(id),
    retry: (failureCount, error) => {
      // Don't retry 4xx errors
      if (axios.isAxiosError(error) && (error.response?.status ?? 0) < 500) return false
      return failureCount < 2
    },
  })
}

// In component
const { data, isLoading, error } = useCampaign(id)
if (error) return <ErrorMessage error={error} />
```

---

## 6. Anti-patterns

```typescript
// ❌ Direct fetch/axios in component body
// ❌ useEffect for data fetching when TanStack Query exists
// ❌ Storing API response in Zustand (duplication — TanStack Query is the cache)
// ❌ Calling apiClient directly from components
// ❌ Hardcoded API URLs — always use process.env.NEXT_PUBLIC_API_URL
// ❌ Waterfall requests — use Promise.all for parallel fetching
// ❌ NEXT_PUBLIC_ prefix on secret API keys
```

---

## Reference files (load only when needed)

## Further reading

The canonical rules for this topic live in the repo:

- `docs/topics/02-api-contract.md` — the reference
- `docs/INDEX.md` — every other topic, with a "read this when" line each
- `AGENTS.md` — the always-loaded rules, which take precedence over this skill

The earlier version of this section pointed at an external `frontend-context/`
guideline folder. That folder is developer-local and gitignored (see `AGENTS.md`),
so those links resolved for nobody — which is exactly how a skill teaches a reader
that its paths are approximate. In-repo docs are canonical: ADR-0012.
