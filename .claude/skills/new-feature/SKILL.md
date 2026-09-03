---
name: new-feature
description: Guides building a new feature or page in this project from scratch. Use when starting a new page, adding a new route, scaffolding a new module, building a new CRUD feature, or asking "how do I add a new page", "what files do I need to create", "what's the build widget for a new feature", "scaffold me a new module".
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# New Feature Build Guide — Senior Frontend

Follow this widget. Do not skip phases — each phase sets up dependencies for the next.

---

## Phase 1 — Foundation (do once per project)

If the project isn't set up yet, read:

---

## Phase 2 — Feature Build Widget

For every new feature (e.g. "Widgets", "Campaigns", "Contacts"):

### Step 1 — Types

```typescript
// src/types/widgets.ts
export interface Widget {
  id: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'cancelled';
  total: number;
  createdAt: string;
  // ...
}

export interface CreateWidgetDto {
  // fields for creation
}

export interface WidgetFilters {
  status?: Widget['status'];
  dateFrom?: string;
  dateTo?: string;
}
```

### Step 2 — Service

```typescript
// src/services/widgets.service.ts
import { apiClient } from '@/lib/api/client';
import type { Widget, CreateWidgetDto, WidgetFilters } from '@/types/widgets';

export const widgetsService = {
  getAll: (filters?: WidgetFilters) =>
    apiClient.get<Widget[]>('/api/widgets/', { params: filters }).then((r) => r.data),
  getById: (id: string) => apiClient.get<Widget>(`/api/widgets/${id}/`).then((r) => r.data),
  create: (dto: CreateWidgetDto) =>
    apiClient.post<Widget>('/api/widgets/', dto).then((r) => r.data),
  update: (id: string, dto: Partial<CreateWidgetDto>) =>
    apiClient.patch<Widget>(`/api/widgets/${id}/`, dto).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/api/widgets/${id}/`),
};
```

### Step 3 — Query hooks

```typescript
// src/lib/hooks/use-widgets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { widgetsService } from '@/services/widgets.service';

export const widgetKeys = {
  all: ['widgets'] as const,
  list: (f?: unknown) => [...widgetKeys.all, 'list', f] as const,
  detail: (id: string) => [...widgetKeys.all, id] as const,
};

export const useWidgets = (filters?: WidgetFilters) =>
  useQuery({ queryKey: widgetKeys.list(filters), queryFn: () => widgetsService.getAll(filters) });

export const useWidget = (id: string) =>
  useQuery({ queryKey: widgetKeys.detail(id), queryFn: () => widgetsService.getById(id) });

export const useCreateWidget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: widgetsService.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: widgetKeys.all }),
  });
};
```

### Step 4 — Zod schema + form (if feature has a form)

```typescript
// src/lib/validations/widgets.ts
import { z } from 'zod';

export const createWidgetSchema = z.object({
  // fields
});

export type CreateWidgetFormData = z.infer<typeof createWidgetSchema>;
```

### Step 5 — Dumb UI component(s)

```
src/components/widgets/
  WidgetsTable.tsx          ← pure display, accepts rows as props
  WidgetsFilters.tsx        ← filter bar, emits onChange
  WidgetStatusBadge.tsx     ← reusable status indicator
```

### Step 6 — Smart container

```typescript
// src/components/widgets/WidgetsContainer.tsx
'use client'
import { useState } from 'react'
import { useWidgets } from '@/lib/hooks/use-widgets'
import { WidgetsTable } from './WidgetsTable'
import { WidgetsFilters } from './WidgetsFilters'

export function WidgetsContainer({ initialFilters }: { initialFilters?: WidgetFilters }) {
  const [filters, setFilters] = useState(initialFilters ?? {})
  const { data, isLoading, error } = useWidgets(filters)

  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      <WidgetsFilters value={filters} onChange={setFilters} />
      <WidgetsTable rows={data ?? []} isLoading={isLoading} />
    </div>
  )
}
```

### Step 7 — Page (Server Component)

```typescript
// src/app/(dashboard)/widgets/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { WidgetsContainer } from '@/components/widgets/WidgetsContainer'

export const metadata = { title: 'Widgets — SAFE' }

export default async function WidgetsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div>
      <h1 className="text-2xl font-semibold">Widgets</h1>
      <WidgetsContainer />
    </div>
  )
}
```

### Step 8 — Route files

```
src/app/(dashboard)/widgets/
  page.tsx           ← list view
  loading.tsx        ← skeleton (auto-shown by Next.js during navigation)
  error.tsx          ← error boundary
  [id]/
    page.tsx         ← detail view
    loading.tsx
```

### Step 9 — Tests

```
src/
  components/widgets/WidgetsTable.test.tsx   ← RTL unit tests
  lib/hooks/use-widgets.test.ts             ← hook tests with MSW
e2e/widgets.spec.ts                         ← Playwright E2E
```

---

## Page Pattern Quick Reference

| Page type         | Server fetches?   | Client state?    | Pattern                             |
| ----------------- | ----------------- | ---------------- | ----------------------------------- |
| List with filters | Initial data only | Filter state     | Server page → Client container      |
| Detail view       | Full data         | Minor UI state   | Server page → small Client islands  |
| Form / Create     | No                | Full form state  | Client form with RHF+Zod            |
| Dashboard         | Parallel fetches  | Charts / toggles | Server page → dynamic Client charts |

---

## Folder colocation rule

Feature code lives together:

```
src/
  components/widgets/     ← all widget UI components
  lib/hooks/             ← use-widgets.ts
  services/              ← widgets.service.ts
  types/                 ← widgets.ts
  app/(dashboard)/widgets/ ← pages
```

Do not scatter a feature's code across unrelated folders.

---

## Reference files (load when needed for specific phases)

## Further reading

The canonical rules for this topic live in the repo:

- `docs/checklists/new-feature.md` — the reference
- `docs/INDEX.md` — every other topic, with a "read this when" line each
- `AGENTS.md` — the always-loaded rules, which take precedence over this skill

The earlier version of this section pointed at an external `frontend-context/`
guideline folder. That folder is developer-local and gitignored (see `AGENTS.md`),
so those links resolved for nobody — which is exactly how a skill teaches a reader
that its paths are approximate. In-repo docs are canonical: ADR-0012.
