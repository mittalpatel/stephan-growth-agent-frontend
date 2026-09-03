---
name: code-review
description: Reviews frontend code against project standards. Use when asked to review a component, PR, or file for correctness, security vulnerabilities, performance issues, anti-patterns, accessibility, or code quality. Triggered by "review this", "check this code", "is this correct", "what's wrong here", "does this follow our patterns".
allowed-tools: Read, Edit, Bash, Grep, Glob
---

# Code Review — Senior Frontend Checklist

Run through each section relevant to the PR. Skip sections that don't apply.

---

## 🔴 Security (block PR if any fail)

### S1 — No secrets in client code

```bash
# Search for exposed secrets
grep -r "NEXT_PUBLIC_" src/ | grep -i "secret\|key\|password\|token"
```

- `NEXT_PUBLIC_` vars are bundled into the browser — never put secrets there
- Secret keys belong in server-only env vars (no `NEXT_PUBLIC_` prefix)

### S2 — Token storage

- Tokens must be in httpOnly cookies (NextAuth handles this)
- `localStorage.setItem('token', ...)` → **reject immediately**

### S3 — dangerouslySetInnerHTML

- Must be wrapped with `DOMPurify.sanitize(html, { ALLOWED_TAGS: [...] })`
- Raw user-controlled HTML → **reject immediately**

### S4 — URL validation

```typescript
// Every user-supplied href must be validated
const isValidUrl = (url: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};
// <a href={userUrl}> without this check → reject
```

### S5 — Authorization in API routes

- Every Route Handler must call `getServerSession(authOptions)` and return 401 if null
- Resource ownership must be verified (not just auth, but `resource.userId === session.user.id`)

### S6 — External links

```tsx
// Must have rel="noopener noreferrer" when target="_blank"
<a href={url} target="_blank" rel="noopener noreferrer">
```

---

## 🟠 Architecture (should fix before merge)

### A1 — Server vs Client component boundary

- `'use client'` should be at the leaf level, not on pages or layouts
- No `useEffect` for data fetching — use Server Components or TanStack Query
- No `async/await` inside Client Components at the top level

### A2 — Service layer respected

- No `fetch()` or `axios.get()` calls directly inside components
- All API calls go: Component → hook → service → apiClient

### A3 — State in the right place

```
App-wide (user, theme, toasts) → Zustand
Page/feature-scoped → Context Provider
Server data → TanStack Query (not Zustand)
Local UI state → useState
URL state (filters, pagination) → nuqs / searchParams
```

### A4 — No magic strings / hardcoded URLs

```typescript
// ❌ Hardcoded URL
fetch('http://localhost:8000/api/campaigns/');

// ✅ Env var
fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/`);
```

### A5 — No `any` type

- `as any` and `: any` hide bugs — replace with proper types or `unknown`
- `// eslint-disable` lines need justification comment

---

## 🟠 Performance (should fix before merge)

### P1 — Images use `next/image`

- Raw `<img>` tags → replace with `<Image>` from `next/image`
- `width` and `height` required unless using `fill`

### P2 — Heavy components lazy-loaded

```typescript
// Charts, editors, maps, modals — must use dynamic import
const Chart = dynamic(() => import('@/components/chart'), { ssr: false });
```

### P3 — No waterfall data fetching

```typescript
// ❌ Sequential (700ms total)
const user = await getUser();
const posts = await getPosts();

// ✅ Parallel (300ms total)
const [user, posts] = await Promise.all([getUser(), getPosts()]);
```

### P4 — List keys are stable IDs, not array index

```tsx
// ❌ items.map((item, i) => <Row key={i} />)
// ✅ items.map(item => <Row key={item.id} />)
```

### P5 — Context values are memoized

```typescript
// If a Context Provider re-renders frequently, its value must be useMemo'd
const value = useMemo(() => ({ data, update }), [data]);
```

---

## 🟡 Code Quality (nice-to-fix)

### Q1 — File size

- Component files > 300 lines → split into sub-components or extract hook
- Hooks > 150 lines → split into smaller hooks

### Q2 — Component logic in hooks

- Business logic (filtering, sorting, API calls) must not live directly in JSX
- Extract to `useXxx` hook

### Q3 — TypeScript strictness

```typescript
// ❌ Overly permissive
interface Props {
  data: object;
}

// ✅ Typed
interface Props {
  data: Campaign;
}
```

### Q4 — Error states handled

- Every `useQuery` / `useMutation` must handle error state in the UI
- Server Components must have an `error.tsx` sibling

### Q5 — Loading states handled

- Every async operation needs a loading indicator or skeleton
- Skeletons must match the final layout dimensions (prevents CLS)

---

## 🔵 Accessibility (check on UI PRs)

- Interactive elements use semantic HTML (`<button>`, not `<div onClick>`)
- All images have meaningful `alt` text (empty `alt=""` only for decorative)
- Form fields have associated `<label htmlFor>` or `aria-label`
- Color is not the only visual distinction (icons or text alongside)
- Keyboard navigation works (Tab widget is logical)

---

## Quick reference — severity

| Pattern                             | Severity |
| ----------------------------------- | -------- |
| Token in localStorage               | 🔴 Block |
| Unsanitized dangerouslySetInnerHTML | 🔴 Block |
| NEXT*PUBLIC* secret                 | 🔴 Block |
| Missing auth check in API route     | 🔴 Block |
| `'use client'` on page/layout       | 🟠 Fix   |
| Direct API call in component        | 🟠 Fix   |
| `any` type                          | 🟠 Fix   |
| `<img>` instead of `<Image>`        | 🟠 Fix   |
| Waterfall requests                  | 🟠 Fix   |
| Index as list key                   | 🟡 Minor |
| Missing loading skeleton            | 🟡 Minor |
| Missing `aria-label`                | 🟡 Minor |

---

## Reference files (load when reviewing specific areas)

## Further reading

The canonical rules for this topic live in the repo:

- `docs/checklists/pr-review.md` — the reference
- `docs/INDEX.md` — every other topic, with a "read this when" line each
- `AGENTS.md` — the always-loaded rules, which take precedence over this skill

The earlier version of this section pointed at an external `frontend-context/`
guideline folder. That folder is developer-local and gitignored (see `AGENTS.md`),
so those links resolved for nobody — which is exactly how a skill teaches a reader
that its paths are approximate. In-repo docs are canonical: ADR-0012.
