---
name: file-structure
description: Guides folder organization and file placement for this project. Use when creating new files, deciding where a component/hook/service/type belongs, naming files, organizing a new feature, asking "where do I put this", "what should I name this file", "how do I structure this feature folder", "which folder does this belong in".
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# File Structure — Senior Frontend Guidelines

## Top-Level Layout (src/)

```
src/
├── app/                  ← App Router pages only — no logic here
│   ├── (auth)/           ← Login, Register, Forgot-password layouts
│   ├── (dashboard)/      ← Protected dashboard routes
│   │   ├── layout.tsx    ← Main dashboard shell (sidebar + header)
│   │   ├── [feature]/
│   │   │   ├── page.tsx          ← Server Component only: metadata + <FeatureClient />
│   │   │   ├── loading.tsx       ← Skeleton shown during navigation
│   │   │   ├── error.tsx         ← Route-level error boundary
│   │   │   └── [id]/page.tsx     ← Detail page
│   └── api/              ← BFF Route Handlers (proxy to Django)
│
├── components/           ← All UI components (see layers below)
├── lib/
│   ├── api/client.ts     ← Axios instance + interceptors
│   ├── hooks/            ← Shared custom hooks
│   └── utils.ts          ← cn() and general utilities
├── services/             ← API service functions (one file per domain)
├── types/                ← TypeScript types (one file per domain)
├── store/                ← Zustand stores
├── providers/            ← React context providers
├── constants/            ← Enums, static config, magic-value replacements
├── config/               ← App config (breadcrumbs, nav, language)
├── locales/              ← i18n strings (es.ts, en.ts, index.ts)
└── hooks/                ← Feature-level hooks (if not in lib/hooks)
```

---

## Component Layer Model

Every component belongs to exactly one layer. A component may only use components from the same layer or below — never skip layers.

```
Layer 1 — Primitive       src/components/ui/          (shadcn: Button, Input, Badge)
Layer 2 — Composed UI     src/components/common/      (DateRangePicker, MultiSelect)
Layer 3 — Domain Widget   src/components/[feature]/   (WidgetStatusBadge, WidgetThumbnail)
Layer 4 — Section         src/components/[feature]/   (WidgetsTable, FilterToolbar)
Layer 5 — Page Shell      src/app/.../[Feature]Client.tsx
```

---

## Feature Colocation Pattern

All code for one feature lives together:

```
Feature: Widgets
─────────────────────────────────────────────────────
Page:       src/app/(dashboard)/widgets/page.tsx
Shell:      src/app/(dashboard)/widgets/WidgetsClient.tsx
Components: src/components/widgets/
              WidgetsTable.tsx
              WidgetsGrid.tsx
              WidgetStatusBadge.tsx
              WidgetDetailHeader.tsx
Hooks:      src/lib/hooks/use-widgets.ts
Service:    src/services/widgets.service.ts
Types:      src/types/widget.ts
```

---

## page.tsx — strict rule

`page.tsx` does exactly two things and nothing else:

```typescript
// app/(dashboard)/widgets/page.tsx
import type { Metadata } from 'next'
import { WidgetsClient } from './WidgetsClient'

export const metadata: Metadata = { title: 'Widgets — SAFE' }

export default function WidgetsPage() {
  return <WidgetsClient />
}
```

- Never `'use client'` on `page.tsx`
- Never `useState`, `useEffect`, or API calls in `page.tsx`
- Never more than ~10 lines in `page.tsx`

---

## Component Size Limits

| Component type                     | Max lines | Action when exceeded          |
| ---------------------------------- | --------- | ----------------------------- |
| Page shell (`*Client.tsx`)         | 150       | Split into section components |
| Section component                  | 100       | Split into domain widgets     |
| Domain widget                      | 60        | Simplify or split             |
| Composed UI (DateRangePicker etc.) | 80        | Acceptable                    |
| Hooks (`useXxx.ts`)                | 150       | Split into smaller hooks      |

Count JSX + logic lines only — not imports or type definitions.

---

## File Naming Conventions

| Type                | Convention                    | Example                           |
| ------------------- | ----------------------------- | --------------------------------- |
| React component     | `PascalCase.tsx`              | `WidgetStatusBadge.tsx`           |
| Page shell (client) | `*Client.tsx` or `*Shell.tsx` | `WidgetsClient.tsx`               |
| Hook                | `use` prefix, `camelCase.ts`  | `useWidgets.ts`                   |
| Service             | `camelCase.service.ts`        | `widgets.service.ts`              |
| Domain types        | `camelCase.ts`                | `widget.ts`                       |
| Constants / config  | `camelCase.ts`                | `roles.ts`, `breadcrumbConfig.ts` |
| Test                | `*.test.ts` / `*.spec.ts`     | `useWidgets.test.ts`              |
| E2E                 | `*.spec.ts` in `e2e/`         | `widgets.spec.ts`                 |

---

## Types — location rule

Types live in `src/types/`, not inside service files:

```typescript
// ✅ src/types/widget.ts
export interface Widget { id: string; status: 'pending' | 'confirmed' | ... }

// ✅ src/services/widgets.service.ts — imports from types
import type { Widget } from '@/types/widget'
```

Never define `interface Widget` inside a service file.

---

## State Ownership — where state lives

```
Filter state, pagination, sort     → URL (nuqs searchParams) — never useState
Modal open/close                   → useState in the component that renders it
Form fields                        → react-hook-form — never useState
Selected row / local UI toggle     → useState in the section that owns it
Server data (API responses)        → TanStack Query — never copied to useState
App-wide (auth, theme, toasts)     → Zustand store
Feature-scoped (wizard, dashboard) → React Context Provider
```

---

## Import Path Aliases (tsconfig.json)

Always use `@/` aliases — never relative paths across feature boundaries:

```typescript
// ✅
import { widgetsService } from '@/services/widgets.service';
import type { Widget } from '@/types/widget';
import { useWidgets } from '@/lib/hooks/use-widgets';

// ❌
import { widgetsService } from '../../services/widgets.service';
```

---

## Reference files (load when needed)

## Further reading

The canonical rules for this topic live in the repo:

- `docs/topics/07-routing-rsc.md` — the reference
- `docs/INDEX.md` — every other topic, with a "read this when" line each
- `AGENTS.md` — the always-loaded rules, which take precedence over this skill

The earlier version of this section pointed at an external `frontend-context/`
guideline folder. That folder is developer-local and gitignored (see `AGENTS.md`),
so those links resolved for nobody — which is exactly how a skill teaches a reader
that its paths are approximate. In-repo docs are canonical: ADR-0012.
