---
name: testing
description: Guides writing tests for this project. Use when writing unit tests, component tests, integration tests, E2E tests, mocking API calls with MSW, testing hooks with React Testing Library, setting up Playwright tests, or asking "how do I test this component", "how do I mock an API", "how do I write a Playwright test", "what should I test here".
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Testing Strategy — Senior Frontend Guidelines

## Testing Pyramid

```
         ╱ E2E ╲          Playwright — few, critical user flows
        ╱────────╲
       ╱Integration╲      Jest + MSW — API boundaries
      ╱──────────────╲
     ╱   Component    ╲   RTL — UI behavior and user interactions
    ╱──────────────────╲
   ╱        Unit        ╲ Jest — hooks, utils, pure functions
  ╱────────────────────────╲
```

---

## 1. Unit Tests — Hooks and Pure Functions

```typescript
// lib/hooks/use-widgets.test.ts
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWidgets } from './use-widgets'
import { server } from '@/test/server'  // MSW server
import { http, HttpResponse } from 'msw'

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
)

it('fetches widgets and returns data', async () => {
  server.use(
    http.get('*/api/widgets/', () => HttpResponse.json([{ id: '1', status: 'pending' }]))
  )
  const { result } = renderHook(() => useWidgets(), { wrapper })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toHaveLength(1)
})
```

```typescript
// lib/utils.test.ts — pure functions
import { formatCurrency } from './utils';

it('formats currency with 2 decimal places', () => {
  expect(formatCurrency(1234.5)).toBe('$1,234.50');
});
```

---

## 2. Component Tests — React Testing Library

```typescript
// components/widgets/WidgetStatusBadge.test.tsx
import { render, screen } from '@testing-library/react'
import { WidgetStatusBadge } from './WidgetStatusBadge'

it('renders "Pending" for pending status', () => {
  render(<WidgetStatusBadge status="pending" />)
  expect(screen.getByText('Pending')).toBeInTheDocument()
})

it('applies destructive variant for cancelled status', () => {
  render(<WidgetStatusBadge status="cancelled" />)
  const badge = screen.getByText('Cancelled')
  expect(badge).toHaveClass('text-red')  // or check aria / data attribute
})
```

**RTL query priority (use in this widget):**

1. `getByRole` — best; matches what screen readers see
2. `getByLabelText` — for form fields
3. `getByPlaceholderText` — for inputs without labels
4. `getByText` — for visible text
5. `getByTestId` — last resort only

**Always test user behavior, not implementation:**

```typescript
// ❌ Testing implementation
expect(wrapper.state('isOpen')).toBe(true);

// ✅ Testing what the user sees
await userEvent.click(screen.getByRole('button', { name: 'Options' }));
expect(screen.getByRole('menu')).toBeVisible();
```

---

## 3. MSW — Mocking API Calls

```typescript
// test/handlers.ts — shared handlers
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('*/api/widgets/', () =>
    HttpResponse.json({ results: mockWidgets, count: mockWidgets.length })
  ),
  http.post('*/api/widgets/', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 'new-1', ...body }, { status: 201 });
  }),
];

// test/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);

// jest.setup.ts
import { server } from '@/test/server';
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

Override a handler for a specific test:

```typescript
server.use(
  http.get('*/api/widgets/', () => HttpResponse.json({ error: 'Server error' }, { status: 500 }))
);
```

---

## 4. Integration Tests — Forms

```typescript
// components/widgets/CreateWidgetForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateWidgetForm } from './CreateWidgetForm'

it('submits form with valid data', async () => {
  const user = userEvent.setup()
  const onSuccess = vi.fn()
  render(<CreateWidgetForm onSuccess={onSuccess} />)

  await user.type(screen.getByLabelText('Customer name'), 'John Doe')
  await user.selectOptions(screen.getByLabelText('Status'), 'pending')
  await user.click(screen.getByRole('button', { name: 'Create Widget' }))

  await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
})

it('shows validation error for empty name', async () => {
  const user = userEvent.setup()
  render(<CreateWidgetForm onSuccess={vi.fn()} />)

  await user.click(screen.getByRole('button', { name: 'Create Widget' }))

  expect(await screen.findByText('Name is required')).toBeInTheDocument()
})
```

---

## 5. E2E Tests — Playwright

```typescript
// e2e/widgets.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Widgets page', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    await page.goto('/login');
    await page.fill('[name=email]', 'admin@example.com');
    await page.fill('[name=password]', 'password');
    await page.click('button[type=submit]');
    await page.waitForURL('/dashboard');
  });

  test('displays widgets list', async ({ page }) => {
    await page.goto('/widgets');
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('row')).toHaveCount.greaterThan(1);
  });

  test('filters widgets by status', async ({ page }) => {
    await page.goto('/widgets');
    await page.selectOption('[data-testid=status-filter]', 'pending');
    await page.waitForURL(/status=pending/);
    // All visible rows should show "Pending" badge
    const badges = page.getByTestId('status-badge');
    for (const badge of await badges.all()) {
      await expect(badge).toHaveText('Pending');
    }
  });
});
```

**Playwright config:**

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 6. What to Test and What NOT to Test

| Test this                              | Don't test this                                    |
| -------------------------------------- | -------------------------------------------------- |
| Business logic in hooks                | Implementation details (internal state)            |
| User-visible behavior in components    | Exact class names (except design tokens)           |
| Error states (API failure, validation) | Third-party library internals (shadcn, RHF)        |
| Critical user flows (E2E)              | Code that's just wiring (simple prop pass-through) |
| Utility functions with edge cases      | Auto-generated code                                |

---

## 7. Test File Location

```
src/
  lib/hooks/
    use-widgets.ts
    use-widgets.test.ts    ← colocated with the hook

  components/widgets/
    WidgetsTable.tsx
    WidgetsTable.test.tsx  ← colocated with the component

e2e/
  widgets.spec.ts          ← Playwright E2E tests in root e2e/
```

---

## Reference files (load when needed)

## Further reading

The canonical rules for this topic live in the repo:

- `docs/topics/09-testing.md` — the reference
- `docs/INDEX.md` — every other topic, with a "read this when" line each
- `AGENTS.md` — the always-loaded rules, which take precedence over this skill

The earlier version of this section pointed at an external `frontend-context/`
guideline folder. That folder is developer-local and gitignored (see `AGENTS.md`),
so those links resolved for nobody — which is exactly how a skill teaches a reader
that its paths are approximate. In-repo docs are canonical: ADR-0012.
