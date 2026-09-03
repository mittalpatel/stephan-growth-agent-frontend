---
name: code-quality
description: Enforces code quality standards for this project. Use when fixing TypeScript types, removing 'any', configuring ESLint, setting up pre-commit hooks, applying naming conventions, enforcing import widget, moving types to the right place, organizing constants, adding i18n strings, or asking "how should I name this", "is my TypeScript correct", "how do I enforce code style".
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Code Quality — Senior Frontend Standards

## 1. TypeScript — No `any`

**Find all `any` usages:**

```bash
grep -rn ": any\|as any\|<any>" src/ --include="*.ts" --include="*.tsx" | grep -v ".test."
```

### Fixing common `any` patterns

```typescript
// ❌ Loose error handler
const getAxiosError = (error: any) => error.response?.data

// ✅ Narrow from unknown
const getAxiosError = (error: unknown): string => {
  if (axios.isAxiosError(error)) return error.response?.data?.message ?? error.message
  return 'Something went wrong'
}

// ❌ Loose metadata
metadata?: any

// ✅ Specific union
metadata?: Record<string, string | number | boolean | null>

// ❌ Loose config
filters?: Record<string, any>

// ✅
filters?: Record<string, string | string[] | number | boolean>
```

**ESLint rule to enforce:**

```javascript
'@typescript-eslint/no-explicit-any': 'error'
```

---

## 2. Naming Conventions

### Files

| Type                | Convention                   | Example                  |
| ------------------- | ---------------------------- | ------------------------ |
| React components    | `PascalCase.tsx`             | `WidgetDetailHeader.tsx` |
| Page shell (client) | `*Client.tsx`                | `WidgetsClient.tsx`      |
| Hooks               | `use` prefix, `camelCase.ts` | `useWidgets.ts`          |
| Services            | `camelCase.service.ts`       | `widgets.service.ts`     |
| Types               | `camelCase.ts`               | `widget.ts`              |
| Constants           | `camelCase.ts`               | `roles.ts`               |
| Test                | `*.test.ts` / `*.spec.ts`    | `useWidgets.test.ts`     |

### Variables and functions

```typescript
// Booleans: is/has/can prefix
const [isLoading, setIsLoading] = useState(false)
const [isModalOpen, setIsModalOpen] = useState(false)
const hasPermission = session.user.role === 'admin'

// Event handlers: handle prefix
const handleSubmit = async (data: FormData) => { ... }
const handleRowClick = (id: string) => { ... }
const handleFilterChange = (filters: WidgetFilters) => { ... }

// Builder/fetcher functions: descriptive verb
const buildWidgetListParams = (params: WidgetFilters) => { ... }
const fetchNotifications = (userId: string) => { ... }
```

### Props interfaces — use `readonly`

```typescript
// ✅ All component prop interfaces use readonly
interface Props {
  readonly widget: Widget;
  readonly onSelect: (id: string) => void;
  readonly isLoading?: boolean;
}
```

---

## 3. Import Organization

Enforce consistent import widget (install `eslint-plugin-import`):

```
Group 1: Built-in Node modules
Group 2: External packages (react, next, axios…)
Group 3: Internal aliases (@/components, @/lib, @/types…)
Group 4: Relative imports (./sibling)
Group 5: Type imports
```

```typescript
// ✅ Correct widget
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { widgetsService } from '@/services/widgets.service';
import { useWidgets } from '@/lib/hooks/use-widgets';

import { WidgetRow } from './WidgetRow';

import type { Widget } from '@/types/widget';
```

---

## 4. Consistent Type Imports

```typescript
// ✅ Always use 'import type' for type-only imports
import type { Widget } from '@/types/widget';
import type { NextRequest } from 'next/server';

// ❌ Regular import for types
import { Widget } from '@/types/widget';
```

ESLint rule: `'@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }]`

---

## 5. Internationalization — All Strings via Locale File

**Zero hardcoded strings in JSX or hooks.** Every user-visible string comes from `src/locales/`.

```typescript
// src/config/language.ts — change here to switch language globally
export const DEFAULT_LANGUAGE: 'es' | 'en' = 'es'

// Usage everywhere
import { t } from '@/locales'

// ✅ In JSX
<button>{t.buttons.save}</button>
<p>{t.auth.forgotPassword}</p>

// ✅ In hooks (toasts, validation messages)
toast.error(t.auth.invalidCredentials)
z.email({ error: t.auth.validation.email })

// ❌ Never
<button>Guardar cambios</button>
toast.error('Error al iniciar sesión')
```

Rules:

- Add new keys to **both** `es.ts` and `en.ts` in the same commit
- Keep keys flat within namespace — max 2 levels of nesting
- Use `{placeholder}` for dynamic values: `t.footer.copyright.replace('{year}', String(year))`

---

## 6. Design Tokens — No Hardcoded Colors

All colors live in `src/app/globals.css` inside `@theme inline`. No hex values in JSX.

```typescript
// ❌ Never in component files
<button className="bg-[#00FFFF] text-[#1a1a1a]" />
<div style={{ backgroundColor: '#8B0000' }} />

// ✅ Use generated token classes
<button className="bg-primary text-login-btn-text hover:bg-primary-hover" />
<div className="text-foreground-crimson" />
```

Adding a new color: add `--color-your-name: #hex;` to `@theme inline` in `globals.css` first, then use `bg-your-name`, `text-your-name` etc.

---

## 7. Types Must Live in `src/types/`

Never define domain types inside service files:

```typescript
// ❌ src/services/widgets.service.ts
export interface Widget { ... }  // wrong place

// ✅ src/types/widget.ts
export interface Widget { ... }
export type WidgetStatus = 'pending' | 'confirmed' | 'shipped' | 'cancelled'

// ✅ src/services/widgets.service.ts
import type { Widget } from '@/types/widget'
```

---

## 8. ESLint Config Checklist

Key rules that must be enabled:

```javascript
// eslint.config.mjs
{
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
  'jsx-a11y/alt-text': 'error',
  'no-console': ['warn', { allow: ['error', 'warn'] }],
  'prefer-const': 'error',
}
```

---

## 9. Pre-commit Hooks

```bash
npm install --save-dev husky lint-staged
npx husky init
```

```json
// package.json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "tsc-files --noEmit"],
  "*.{ts,tsx,css,json,md}": "prettier --write"
}
```

---

## 10. Daily Quality Commands

```bash
# Check types
npx tsc --noEmit

# Find any types
grep -rn ": any\|as any" src/ --include="*.ts" --include="*.tsx" | grep -v ".test."

# Find hardcoded colors
grep -rn 'bg-\[#\|text-\[#\|style=.*color' src/ --include="*.tsx"

# Find hardcoded strings (non-locale)
grep -rn '>[A-ZÁÉÍÓÚ][a-záéíóú]' src/components --include="*.tsx" | grep -v "//"

# Unused files
npx knip
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
