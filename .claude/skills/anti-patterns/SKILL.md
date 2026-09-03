---
name: anti-patterns
description: Identifies and fixes anti-patterns in this project. Use when spotting bad code, reviewing for issues to avoid, asking "what should I NOT do", "is this pattern correct", "why is this wrong", "what are common mistakes here". Covers security anti-patterns, code quality anti-patterns, state management mistakes, and React/Next.js misuse.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Anti-Patterns — What NOT To Do

## 🔴 Security Anti-Patterns (fix immediately)

### S1 — Credentials in .env committed to git

```bash
# Detect
git log --all -- .env | head -5
```

If `.env` with real values was ever committed: rotate ALL secrets now, then `git rm --cached .env`.

### S2 — Token in localStorage

```typescript
// ❌ CRITICAL — accessible to any XSS
localStorage.setItem('access_token', token);

// ✅ Use NextAuth httpOnly cookies (automatic)
```

### S3 — Secret in NEXT*PUBLIC* env var

```typescript
// ❌ CRITICAL — bundled into browser
process.env.NEXT_PUBLIC_STRIPE_SECRET;

// ✅ Server-only (no NEXT_PUBLIC_ prefix)
process.env.STRIPE_SECRET_KEY; // only in Route Handlers / Server Components
```

### S4 — dangerouslySetInnerHTML without sanitization

```typescript
// ❌ XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput, { ALLOWED_TAGS: ['p','b','i','a'] }) }} />
```

### S5 — Unvalidated user-supplied URL

```typescript
// ❌ javascript: URL attack
<a href={userUrl}>click</a>

// ✅
const safe = /^https?:\/\//.test(userUrl)
{safe && <a href={userUrl} rel="noopener noreferrer">click</a>}
```

### S6 — Missing auth check in API Route Handler

```typescript
// ❌ Anyone can call this
export async function DELETE(req, { params }) {
  await db.delete(params.id);
}

// ✅
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  // verify ownership before deleting
}
```

---

## 🟠 Next.js / React Anti-Patterns

### N1 — 'use client' on page.tsx or layout.tsx

```typescript
// ❌ Breaks server rendering and metadata exports
'use client'
export const metadata = { title: '...' }  // silently ignored

// ✅ page.tsx is always a Server Component
export const metadata = { title: 'Widgets' }
export default function WidgetsPage() {
  return <WidgetsClient />  // push 'use client' into the shell component
}
```

### N2 — useEffect for data fetching

```typescript
// ❌ Waterfall, no caching, loading state boilerplate
useEffect(() => {
  fetch('/api/widgets')
    .then((r) => r.json())
    .then(setWidgets);
}, []);

// ✅ TanStack Query handles caching, deduplication, loading/error
const { data, isLoading, error } = useWidgets();
```

### N3 — Sequential (waterfall) server data fetching

```typescript
// ❌ 700ms total (sequential)
const user = await getUser();
const widgets = await getWidgets();
const stats = await getStats();

// ✅ 300ms total (parallel)
const [user, widgets, stats] = await Promise.all([getUser(), getWidgets(), getStats()]);
```

### N4 — Duplicating server state in useState

```typescript
// ❌ Now you have two sources of truth
const { data } = useWidgets();
const [widgets, setWidgets] = useState(data); // copy is always stale

// ✅ Use TanStack Query directly
const { data: widgets } = useWidgets();
```

### N5 — Index as list key

```typescript
// ❌ Items get wrong state when list reorders
items.map((item, i) => <Row key={i} {...item} />)

// ✅
items.map(item => <Row key={item.id} {...item} />)
```

### N6 — Passing non-serializable data from Server → Client

```typescript
// ❌ Functions and class instances can't cross the Server→Client boundary
<ClientComponent onClick={someServerFunction} data={new MyClass()} />

// ✅ Pass plain objects and primitives only
<ClientComponent data={{ id: item.id, name: item.name }} />
```

---

## 🟠 State Management Anti-Patterns

### M1 — Zustand for per-page/feature state

```typescript
// ❌ Persists after the user navigates away; creates memory leaks
const useWidgetFiltersStore = create(...)

// ✅ URL state for filters (auto-cleaned, shareable, bookmarkable)
const [status, setStatus] = useQueryState('status')
```

### M2 — Prop drilling beyond 2 levels

```typescript
// ❌ session passed through 4 component layers
<Widgets session={session}>
  <WidgetsTable session={session}>
    <WidgetRow session={session} />

// ✅ consume directly
function WidgetRow({ widget }) {
  const { data: session } = useSession()
  const canEdit = hasPermission(session, 'widgets', 'write')
}
```

### M3 — Calling the same hook in sibling components

```typescript
// ❌ Two network requests for the same data
function WidgetsTable() { const { data } = useWidgets() }
function WidgetsGrid()  { const { data } = useWidgets() }

// ✅ Fetch once in the parent, pass down
function WidgetsClient() {
  const { data } = useWidgets()
  return viewMode === 'table' ? <WidgetsTable widgets={data} /> : <WidgetsGrid widgets={data} />
}
```

---

## 🟠 Code Quality Anti-Patterns

### Q1 — any type

```typescript
// ❌ Silently hides bugs
function processData(data: any) { return data.items }

// ✅
function processData(data: ApiResponse<Widget[]>) { return data.items }

// When error shape is unknown, use unknown and narrow
function handleError(error: unknown) {
  if (axios.isAxiosError(error)) { ... }
}
```

### Q2 — Logic inside JSX / in component body

```typescript
// ❌ Business logic directly in component
export function WidgetsPage() {
  const [widgets, setWidgets] = useState([])
  const [filters, setFilters] = useState({})
  useEffect(() => { fetchWidgets(filters).then(setWidgets) }, [filters])
  const filtered = widgets.filter(o => o.status !== 'cancelled')
  // ...
}

// ✅ Extract to hook
export function WidgetsPage() {
  const { widgets, filters, setFilters } = useWidgets()
  return <WidgetsView widgets={widgets} filters={filters} onFilterChange={setFilters} />
}
```

### Q3 — Hardcoded colors in JSX

```typescript
// ❌ Magic color values scattered across files
<button className="bg-[#00FFFF] text-[#1a1a1a]" />
<div style={{ backgroundColor: '#8B0000' }} />

// ✅ Use design tokens from globals.css @theme inline
<button className="bg-primary text-login-btn-text" />
```

### Q4 — Hardcoded UI strings in JSX

```typescript
// ❌ Strings scattered across components, impossible to translate
<button>Guardar cambios</button>
toast.error('Error al guardar')

// ✅ Always use locale file
import { t } from '@/locales'
<button>{t.buttons.save}</button>
toast.error(t.errors.saveFailed)
```

### Q5 — Hardcoded API URLs

```typescript
// ❌ Breaks in staging/production
fetch('http://localhost:8000/api/v1/widgets/');
apiClient.get('/api/v1/widgets/?page=1&limit=10');

// ✅ Service layer builds URLs
widgetsService.getAll({ page: 1, limit: 10 });
```

### Q6 — Types inside service files

```typescript
// ❌ Types buried inside services/widgets.ts
export interface Widget { ... }  // inside services file

// ✅ Types in src/types/widget.ts, imported by service
import type { Widget } from '@/types/widget'
```

### Q7 — Barrel imports from large libraries

```typescript
// ❌ Imports entire lodash (70KB+)
import _ from 'lodash';
import * as Icons from 'lucide-react';

// ✅ Named imports only
import sortBy from 'lodash/sortBy';
import { Search, Menu } from 'lucide-react';
```

### Q8 — Inline style objects (non-color)

```typescript
// ❌ New object reference every render = unnecessary re-renders
<div style={{ marginTop: 8, display: 'flex' }} />

// ✅ Tailwind classes
<div className="mt-2 flex" />
```

---

## Quick grep to find anti-patterns in this codebase

```bash
# any types
grep -rn ": any\|as any" src/ --include="*.ts" --include="*.tsx"

# localStorage token usage
grep -rn "localStorage" src/ --include="*.ts" --include="*.tsx"

# NEXT_PUBLIC_ secrets
grep -rn "NEXT_PUBLIC_" src/ --include="*.ts" --include="*.tsx" | grep -i "secret\|key\|password"

# hardcoded colors in JSX
grep -rn 'bg-\[#\|text-\[#\|style=.*color' src/ --include="*.tsx"

# Missing 'use client' boundary check (useEffect in server context)
grep -rn "useEffect\|useState" src/app --include="*.tsx" | grep -v "Client\|client"

# Hardcoded UI strings (Spanish text directly in JSX)
grep -rn ">[A-ZÁÉÍÓÚ][a-záéíóú]" src/components --include="*.tsx" | grep -v "//"
```

---

## Reference files (load when needed)

## Further reading

The canonical rules for this topic live in the repo:

- `docs/checklists/pr-review.md` — the reference
- `docs/INDEX.md` — every other topic, with a "read this when" line each
- `AGENTS.md` — the always-loaded rules, which take precedence over this skill

The earlier version of this section pointed at an external `frontend-context/`
guideline folder. That folder is developer-local and gitignored (see `AGENTS.md`),
so those links resolved for nobody — which is exactly how a skill teaches a reader
that its paths are approximate. In-repo docs are canonical: ADR-0012.
