---
name: error-handling
description: Guides error handling implementation for this project. Use when adding error boundaries, creating error.tsx files, handling API errors, showing toast notifications, logging errors, mapping backend validation errors to form fields, or asking "how do I handle this error", "what happens when the API fails", "how do I show an error message", "where do I put my error boundary".
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Error Handling — Senior Frontend Guidelines

## Error Type → Strategy

| Error                  | Where to handle                    | User sees                     |
| ---------------------- | ---------------------------------- | ----------------------------- |
| Unhandled render error | Error boundary / `error.tsx`       | Fallback UI + retry button    |
| Route-level crash      | `error.tsx` sibling to `page.tsx`  | Per-route error page          |
| API request failure    | TanStack Query `error` state       | Inline error message or toast |
| Form validation        | React Hook Form `formState.errors` | Inline field error            |
| 404 not found          | `not-found.tsx`                    | Custom 404 page               |
| Auth failure (401)     | Axios interceptor → redirect       | Redirect to `/login`          |

---

## 1. Route Error Files (required per route)

Every route that fetches data must have a sibling `error.tsx`:

```typescript
// app/(dashboard)/widgets/error.tsx
'use client'

interface ErrorPageProps {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}

export default function WidgetsError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to error monitoring
    console.error('[WidgetsError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <h2 className="text-xl font-semibold">{t.errors.somethingWentWrong}</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>{t.actions.tryAgain}</Button>
    </div>
  )
}
```

Also add `not-found.tsx` for dynamic routes:

```typescript
// app/(dashboard)/widgets/[widgetId]/not-found.tsx
export default function WidgetNotFound() {
  return (
    <div>
      <h2>{t.errors.widgetNotFound}</h2>
      <Link href="/widgets">{t.actions.backToWidgets}</Link>
    </div>
  )
}
```

---

## 2. Reusable Error Boundary Component

```typescript
// components/common/ErrorBoundary.tsx
'use client'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  readonly children: ReactNode
  readonly fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Send to Sentry or similar in production
    if (process.env.NODE_ENV === 'production') {
      // logToSentry(error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 border border-red-200 rounded bg-red-50">
          <p className="text-red-600 text-sm">{t.errors.componentError}</p>
          <button
            className="mt-2 text-xs text-red-500 underline"
            onClick={() => this.setState({ hasError: false })}
          >
            {t.actions.retry}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

---

## 3. API Error Handling in Hooks

```typescript
// lib/hooks/use-widgets.ts
export function useWidgets(filters?: WidgetFilters) {
  return useQuery({
    queryKey: widgetKeys.list(filters),
    queryFn: () => widgetsService.getAll(filters),
    retry: (failureCount, error) => {
      // Never retry 4xx errors
      if (axios.isAxiosError(error) && (error.response?.status ?? 0) < 500) return false
      return failureCount < 2  // retry 5xx up to twice
    },
  })
}

// In the component
const { data, isLoading, error } = useWidgets()
if (error) return <ErrorMessage error={error} />
```

---

## 4. Mapping Backend Errors to Form Fields

```typescript
// In a mutation's onError callback
const { mutate } = useUpdateWidget();

const onSubmit = (data: FormData) => {
  mutate(data, {
    onSuccess: () => toast.success(t.widgets.updated),
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const fieldErrors = error.response.data as Record<string, string[]>;
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof FormData, {
            message: messages[0],
          });
        });
      } else {
        toast.error(t.errors.unexpectedError);
      }
    },
  });
};
```

---

## 5. Toast Notifications

Use `react-hot-toast` (already installed) via the locale file for all messages:

```typescript
import toast from 'react-hot-toast';
import { t } from '@/locales';

// Success
toast.success(t.widgets.created);

// Error
toast.error(t.errors.saveFailed);

// Loading → then success/error
const toastId = toast.loading(t.actions.saving);
try {
  await save();
  toast.success(t.widgets.saved, { id: toastId });
} catch {
  toast.error(t.errors.saveFailed, { id: toastId });
}
```

**Provider** (must be in root layout once):

```tsx
// app/layout.tsx
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
```

---

## 6. Error Logging (Production)

```typescript
// lib/monitoring.ts
export function logError(error: Error, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error, { extra: context })
  } else {
    console.error('[Error]', error, context);
  }
}

// Usage in error boundaries and critical catch blocks
logError(error, { page: 'widgets', userId: session?.user.id });
```

---

## 7. User-Friendly Error Messages

```typescript
// lib/utils/error-messages.ts
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return t.errors.unauthorized;
    if (status === 403) return t.errors.forbidden;
    if (status === 404) return t.errors.notFound;
    if (status === 422) return t.errors.validationFailed;
    if (status && status >= 500) return t.errors.serverError;
  }
  if (error instanceof Error) return error.message;
  return t.errors.unexpectedError;
}
```

---

## Anti-patterns

```typescript
// ❌ Swallowing errors silently
try {
  await save();
} catch {} // user never knows it failed

// ❌ Exposing technical errors to users
toast.error(error.stack); // shows stack trace to user

// ❌ console.error in production without monitoring
// ❌ Not handling isLoading/error states from useQuery
// ❌ error.tsx missing for routes with data fetching
```

---

## Reference files (load when needed)

## Further reading

The canonical rules for this topic live in the repo:

- `docs/topics/02-api-contract.md` — the reference
- `docs/INDEX.md` — every other topic, with a "read this when" line each
- `AGENTS.md` — the always-loaded rules, which take precedence over this skill

The earlier version of this section pointed at an external `frontend-context/`
guideline folder. That folder is developer-local and gitignored (see `AGENTS.md`),
so those links resolved for nobody — which is exactly how a skill teaches a reader
that its paths are approximate. In-repo docs are canonical: ADR-0012.
