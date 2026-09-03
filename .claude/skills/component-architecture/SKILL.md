---
name: component-architecture
description: Guides component design decisions for this project. Use when creating a new component, deciding between Server and Client components, structuring compound components, designing custom hooks, applying the Provider pattern, or asking "should this be a server or client component", "how do I avoid prop drilling", "how do I build a reusable component".
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Component Architecture — Senior Frontend Guidelines

## 1. Server vs Client — Decision Rule

**Default: Server Component.** Only add `'use client'` when you need:

- `useState` / `useReducer` / `useEffect`
- Browser APIs (`window`, `document`, `localStorage`)
- Event handlers (`onClick`, `onChange`)
- Third-party client-only libraries

**Never put `'use client'` at a layout or page level just for convenience.** Push it down to the leaf that actually needs it.

### Decision matrix

| Needs                             | Use                                          |
| --------------------------------- | -------------------------------------------- |
| Data fetching, DB access, secrets | Server Component                             |
| Interactive UI, state, events     | Client Component                             |
| Both data + interactivity         | Server fetches → passes props to Client leaf |

### Composition pattern (Server wraps Client)

```tsx
// ✅ Server Component fetches data
export default async function CampaignsPage() {
  const campaigns = await fetchCampaigns(); // runs on server
  return <CampaignsTable initialData={campaigns} />; // Client Component
}

// ✅ Client Component receives serializable props
('use client');
export function CampaignsTable({ initialData }) {
  const [data, setData] = useState(initialData);
  // ...
}
```

### Anti-patterns to reject in review

```tsx
// ❌ 'use client' on a page just to read a cookie
// ❌ useEffect to fetch data that could be a Server Component
// ❌ Passing non-serializable objects (class instances, functions) as props from Server→Client
// ❌ Importing a Server Component inside a 'use client' file
```

---

## 2. Component Development Flow

Follow this sequence for every feature component:

```
1. Dumb UI (pure presentational, no logic)
      ↓
2. Logic hook  (useXxx — all state, effects, handlers)
      ↓
3. Smart container  (wires hook → dumb UI)
      ↓
4. Server page  (fetches initial data, passes to container)
```

### Example — Widgets table

```
src/
  components/widgets/
    WidgetsTable.tsx          ← dumb UI: receives rows, renders table
    useWidgets.ts             ← logic: filter state, sort, pagination
    WidgetsTableContainer.tsx ← smart: useWidgets() → <WidgetsTable />
  app/(dashboard)/widgets/
    page.tsx                 ← Server: await fetchWidgets() → <WidgetsTableContainer />
```

---

## 3. Compound Components

Use when a component would otherwise need 4+ config props.

```tsx
// ✅ Compound — flexible, no prop explosion
<Dropdown>
  <Dropdown.Trigger>Options</Dropdown.Trigger>
  <Dropdown.Content>
    <Dropdown.Item onSelect={edit}>Edit</Dropdown.Item>
    <Dropdown.Separator />
    {isAdmin && (
      <Dropdown.Item onSelect={del} variant="destructive">
        Delete
      </Dropdown.Item>
    )}
  </Dropdown.Content>
</Dropdown>
```

**Implementation**: Parent holds state in Context → child components consume via `useContext`. See full example:

**When to use**: Tabs, Accordions, Dropdowns, Selects, Card with Header/Body/Footer, DataTable rows.

---

## 4. Custom Hooks

Extract any logic that is more than a single `useState` into a `useXxx` hook.

```tsx
// ✅ Encapsulated hook
export function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}
```

Shared hooks live in `src/hooks/`. A hook used by one feature is colocated with it —
`src/app/(restricted)/projects/hooks/useProjectsList.ts` — and only moves to `src/hooks/`
when a second feature actually needs it, not in anticipation.

Hooks this project already provides: `useAuthQuery`, `useAuthMutation`, `useQueryParams`,
`useDebouncedSearch`, `useInvalidateCache`, `usePermissions`. Check
`src/hooks/` before writing a new one.

---

## 5. Provider Pattern — when to use Context vs Zustand

| Situation                                                              | Use                    |
| ---------------------------------------------------------------------- | ---------------------- |
| Data scoped to one route/feature (campaign dashboard, multi-step form) | React Context Provider |
| App-wide data (user session, global theme, toast queue)                | Zustand store          |

**Rule**: Providers auto-clean when the component unmounts. Zustand persists. Don't use Zustand for per-page state.

```tsx
// ✅ Scoped Context for a campaign page
export function CampaignProvider({ children, initialCampaign }) {
  const [campaign, setCampaign] = useState(initialCampaign);
  return (
    <CampaignContext.Provider value={{ campaign, setCampaign }}>
      {children}
    </CampaignContext.Provider>
  );
}

// ✅ Always export a typed guard hook
export function useCampaignContext() {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error('useCampaignContext must be used inside CampaignProvider');
  return ctx;
}
```

---

## 6. Folder Structure for Components

```
src/components/
  ui/          ← shadcn/ui primitives only — do not modify these directly
  common/      ← shared across features (Avatar, PageHeader, DataTable)
  layout/      ← Header, Sidebar, Breadcrumb, LayoutWrapper
  [feature]/   ← colocated feature components (widgets/, campaigns/, auth/)
```

Naming: `PascalCase.tsx` for components, `camelCase.ts` for hooks and utils.

---

## Reference files (load only when needed)

## Further reading

The canonical rules for this topic live in the repo:

- `docs/topics/08-state.md` — the reference
- `docs/INDEX.md` — every other topic, with a "read this when" line each
- `AGENTS.md` — the always-loaded rules, which take precedence over this skill

The earlier version of this section pointed at an external `frontend-context/`
guideline folder. That folder is developer-local and gitignored (see `AGENTS.md`),
so those links resolved for nobody — which is exactly how a skill teaches a reader
that its paths are approximate. In-repo docs are canonical: ADR-0012.
