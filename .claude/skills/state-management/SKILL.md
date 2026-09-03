---
name: state-management
description: Guides state management decisions for this project. Use when deciding where to store state, setting up a Zustand store, using URL state with nuqs, avoiding state duplication, managing URL-based filters and pagination, or asking "where should this state live", "should I use useState or Zustand", "how do I sync filters with the URL", "how do I share state between components".
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# State Management — Senior Frontend Guidelines

## Decision Tree — Where Does State Live?

```
Can it be derived from props or URL?
  → YES: Don't store it, compute it

Is it a URL-navigable concern? (filters, pagination, sort, search)
  → YES: URL state via nuqs (searchParams)

Is it form field values?
  → YES: react-hook-form

Is it data from the server?
  → YES: TanStack Query — never copy to useState

Is it local UI state? (modal open, tab active, accordion open)
  → YES: useState in the component that renders it

Is it shared across a route/feature subtree?
  → YES: React Context Provider (scoped, auto-cleans on unmount)

Is it truly app-wide? (auth user, global theme, notification queue)
  → YES: Zustand store
```

---

## 1. URL State — Filters, Pagination, Search

Use `nuqs` for any state that should survive navigation, be bookmarkable, or shareable.

```typescript
'use client'
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs'

export function WidgetsClient() {
  const [status, setStatus] = useQueryState('status', parseAsString.withDefault(''))
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))

  const { data } = useWidgets({ status, page, search })

  return (
    <>
      <WidgetsFilters
        status={status}
        search={search}
        onStatusChange={setStatus}
        onSearchChange={setSearch}
      />
      <WidgetsTable widgets={data?.results ?? []} />
      <Pagination page={page} total={data?.count ?? 0} onPageChange={setPage} />
    </>
  )
}
```

**Rules:**

- Filter state → URL (never `useState`)
- Pagination → URL
- Search query → URL (with debounce before the API call)
- Never use Zustand for data that belongs in the URL

---

## 2. Zustand — Global App-Wide State

Only for state that must persist across all routes: user session extras, global modals, notification queue, cart.

```typescript
// store/use-app-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  notificationCount: number;
  setNotificationCount: (n: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      notificationCount: 0,
      setNotificationCount: (n) => set({ notificationCount: n }),
    }),
    { name: 'app-store' } // persists to localStorage
  )
);
```

**Usage:**

```typescript
// In any component anywhere in the app
const { sidebarCollapsed, toggleSidebar } = useAppStore();
```

**What goes in Zustand:**

- Sidebar collapsed/expanded state
- Notification count badge
- Global modal state (if triggered from anywhere)
- User preferences that survive page reload

**What does NOT go in Zustand:**

- Server data (use TanStack Query)
- Page-scoped state (use Context or useState)
- URL state (filters, pagination)
- Form state (use RHF)

---

## 3. React Context Provider — Feature-Scoped State

For state shared across a route subtree (e.g., campaign detail page with multiple tabs):

```typescript
// providers/PreferencesProvider.tsx
interface PreferencesContextType {
  timezone: string
  ivaEnabled: boolean
  setTimezone: (tz: string) => void
  setIvaEnabled: (v: boolean) => void
}

const PreferencesContext = createContext<PreferencesContextType | null>(null)

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [timezone, setTimezone] = useState('UTC')
  const [ivaEnabled, setIvaEnabled] = useState(false)

  // Cross-tab sync via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel('preferences')
    const handler = (e: MessageEvent) => {
      if (e.data.timezone) setTimezone(e.data.timezone)
      if ('ivaEnabled' in e.data) setIvaEnabled(e.data.ivaEnabled)
    }
    channel.addEventListener('message', handler)
    return () => channel.close()
  }, [])

  const value = useMemo(
    () => ({ timezone, ivaEnabled, setTimezone, setIvaEnabled }),
    [timezone, ivaEnabled]
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be inside <PreferencesProvider>')
  return ctx
}
```

Place providers in `layout.tsx` so the whole route subtree can access them — never inline in a page component.

---

## 4. TanStack Query — Server State

The query cache IS the single source of truth for server data. Never copy it to `useState` or Zustand.

```typescript
// ✅ Query for reading
const { data: widgets, isLoading, error } = useWidgets(filters);

// ✅ Mutation for writing — invalidates cache after success
const { mutate } = useMutation({
  mutationFn: widgetsService.updateStatus,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: widgetKeys.all }),
});

// ❌ Never do this
const { data } = useWidgets();
const [localWidgets, setLocalWidgets] = useState(data); // stale copy!
```

---

## 5. Anti-patterns

```typescript
// ❌ Zustand for per-page filter state
const useWidgetFilters = create(() => ({ status: '', page: 1 }))
// → Use nuqs URL state instead

// ❌ useState for data that comes from useQuery
const { data } = useWidgets()
const [widgets, setWidgets] = useState(data ?? [])
// → Use data directly from useQuery

// ❌ Zustand for server data
const useWidgetsStore = create(() => ({ widgets: [], fetch: async () => { ... } }))
// → Use TanStack Query

// ❌ Multiple components calling the same useWidgets() hook (double fetch)
// → Fetch once in parent, pass data down as props
```

---

## Reference files (load when needed)

## Further reading

The canonical rules for this topic live in the repo:

- `docs/topics/08-state.md` — the reference
- `docs/INDEX.md` — every other topic, with a "read this when" line each
- `AGENTS.md` — the always-loaded rules, which take precedence over this skill

The earlier version of this section pointed at an external `frontend-context/`
guideline folder. That folder is developer-local and gitignored (see `AGENTS.md`),
so those links resolved for nobody — which is exactly how a skill teaches a reader
that its paths are approximate. In-repo docs are canonical: ADR-0012.
