---
name: ui-components
description: Guides UI component usage and styling for this project. Use when using shadcn/ui components, working with Tailwind CSS, adding design tokens, building modals/dialogs/dropdowns, using Radix UI primitives, creating accessible UI, adding Lucide icons, or asking "how do I use this shadcn component", "how do I add a new color", "how do I style this button", "which UI component should I use".
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# UI Components — Senior Frontend Guidelines

## Stack

- **shadcn/ui** — composed components built on Radix UI (source in `src/components/ui/`)
- **Radix UI** — accessible unstyled primitives (used inside shadcn)
- **Tailwind CSS v4** — utility classes
- **Design tokens** — colors and fonts defined in `globals.css` `@theme inline`
- **Lucide React** — icon library

---

## 1. Design Tokens — Colors and Fonts

All visual values are defined **once** in `src/app/globals.css`. Never use hex values in JSX.

```css
/* globals.css */
@theme inline {
  /* Brand colors */
  --primary: #00ffff;
  --primary-hover: #00e5e5;
  --crimson: #8b0000;
  --gold: #fed700;
  --color-login-btn-text: #1a1a1a;
  --text-dark: #111111;

  /* Fonts */
  --font-sans: 'Poppins', sans-serif;
  --font-heading: 'Urbanist', sans-serif;
}
```

Tailwind auto-generates `bg-primary`, `text-foreground-cyan`, `hover:bg-primary-hover`, etc.

```tsx
// ✅ Use token classes
<button className="bg-primary text-login-btn-text hover:bg-primary-hover font-heading">
  Action
</button>

// ❌ Never
<button className="bg-[#00FFFF] text-[#1a1a1a]" style={{ backgroundColor: '#00FFFF' }}>
```

Adding a new color: add `--color-your-name: #hex;` in `@theme inline` first, then use `bg-your-name`.

---

## 2. shadcn/ui — Core Components

### Adding components

```bash
npx shadcn@latest add button input label form card badge
npx shadcn@latest add dialog sheet dropdown-menu popover
npx shadcn@latest add table tabs select checkbox
npx shadcn@latest add toast avatar separator skeleton
```

Components are installed to `src/components/ui/` — do not modify their logic directly. Customize via Tailwind classes or `className` prop.

### Button variants

```tsx
import { Button } from '@/components/ui/button'

<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Subtle</Button>
<Button variant="link">Link style</Button>
<Button size="sm">Small</Button>
<Button disabled>Disabled</Button>
<Button disabled={isPending}>
  {isPending ? <Spinner className="h-4 w-4 animate-spin" /> : 'Save'}
</Button>
```

### Form with shadcn

```tsx
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input type="email" placeholder="user@example.com" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>;
```

### Dialog (modal)

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Confirm Delete</DialogTitle>
    </DialogHeader>
    <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={handleDelete}>
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

### Badge

```tsx
import { Badge } from '@/components/ui/badge'

<Badge variant="default">Active</Badge>
<Badge variant="destructive">Cancelled</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="outline">Draft</Badge>
```

---

## 3. Tailwind Conventions

```tsx
// Use cn() utility for conditional classes
import { cn } from '@/lib/utils';

<div
  className={cn(
    'rounded border px-4 py-2',
    isActive && 'border-primary bg-primary/10',
    isDisabled && 'opacity-50 cursor-not-allowed'
  )}
/>;
```

### Layout classes quick reference

```
flex items-center gap-2          — horizontal stack
flex flex-col gap-4              — vertical stack
grid grid-cols-2 gap-4           — 2-column grid
flex-1 min-w-0                   — flex child that shrinks
relative / absolute inset-0      — positioned overlay
sticky top-0 z-10                — sticky header
overflow-hidden / overflow-auto  — scroll containment
```

### Responsive prefix widget (mobile-first)

```tsx
<div className="w-full md:w-1/2 lg:w-1/3" />
```

---

## 4. Icons — Lucide React

```tsx
import { Search, Plus, Trash2, ChevronDown, Loader2 } from 'lucide-react'

// Standard icon
<Search className="h-4 w-4" />

// Button with icon
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Widget
</Button>

// Spinning loader icon
<Loader2 className="h-4 w-4 animate-spin" />

// Always import individually — never import *
```

---

## 5. Skeleton / Loading States

Skeletons must match the exact height of the component they replace (prevents CLS):

```tsx
// ✅ Skeleton matches final layout
function WidgetRowSkeleton() {
  return (
    <div className="flex items-center gap-4 h-16 px-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-32 flex-1" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

// In the component
if (isLoading)
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <WidgetRowSkeleton key={i} />
      ))}
    </>
  );
```

---

## 6. Common Patterns

### Status badge (domain widget)

```tsx
const statusVariants: Record<WidgetStatus, BadgeVariant> = {
  pending: 'secondary',
  confirmed: 'default',
  shipped: 'default',
  cancelled: 'destructive',
};

export function WidgetStatusBadge({ status }: { status: WidgetStatus }) {
  return <Badge variant={statusVariants[status]}>{t.widgets.statuses[status]}</Badge>;
}
```

### Empty state

```tsx
function EmptyWidgets() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <PackageOpen className="h-12 w-12 text-muted-foreground" />
      <h3 className="font-medium">{t.widgets.empty.title}</h3>
      <p className="text-sm text-muted-foreground">{t.widgets.empty.description}</p>
    </div>
  );
}
```

---

## Reference files (load when needed)

## Further reading

The canonical rules for this topic live in the repo:

- `docs/topics/15-ui-design.md` — the reference
- `docs/INDEX.md` — every other topic, with a "read this when" line each
- `AGENTS.md` — the always-loaded rules, which take precedence over this skill

The earlier version of this section pointed at an external `frontend-context/`
guideline folder. That folder is developer-local and gitignored (see `AGENTS.md`),
so those links resolved for nobody — which is exactly how a skill teaches a reader
that its paths are approximate. In-repo docs are canonical: ADR-0012.
