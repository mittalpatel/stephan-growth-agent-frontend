---
name: design-patterns
description: Applies frontend design patterns for this project. Use when designing a reusable component API, deciding between compound components vs props, implementing the container/presenter split, building a custom hook, applying the Provider pattern, or asking "what pattern should I use here", "how do I avoid prop explosion", "how do I share state without prop drilling", "how do I separate logic from UI".
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Design Patterns — Senior Frontend Guidelines

## Pattern 1: Container / Presenter Split

The most fundamental pattern. Every interactive feature is split into two files:

| File               | Contains                                                 |
| ------------------ | -------------------------------------------------------- |
| `useXxx.ts` (hook) | schema, state, API calls, routing, toasts, loading/error |
| `XxxComponent.tsx` | JSX only — receives values from hook, no logic           |

**A component file must NOT contain:**

- `useState` for loading/error/API state
- Direct `signIn`, `axios`, `fetch`, or `apiClient` calls
- `useRouter` + navigation logic
- Zod schema definitions
- `toast(...)` calls

```typescript
// ✅ hooks/useLoginForm.ts — all logic
export function useLoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const onSubmit = form.handleSubmit(async (values) => {
    setIsLoading(true)
    const res = await signIn('credentials', { ...values, redirect: false })
    setIsLoading(false)
    if (!res?.ok) { toast.error(t.auth.invalidCredentials); return }
    router.push('/dashboard')
  })

  return { form, isLoading, onSubmit }
}

// ✅ components/auth/LoginForm.tsx — UI only
export default function LoginForm() {
  const { form, isLoading, onSubmit } = useLoginForm()
  return (
    <form onSubmit={onSubmit}>
      <Input {...form.register('email')} />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? <Spinner /> : t.auth.login}
      </Button>
    </form>
  )
}
```

---

## Pattern 2: Compound Components

Use when a component needs 4+ config props OR when consumers need to control layout of children.

### The problem (prop explosion)

```tsx
// ❌ Hard to extend, consumers can't control markup
<Dropdown
  options={[{ label: 'Edit' }, { label: 'Delete' }]}
  buttonLabel="Options"
  showIcons={true}
  menuPosition="right"
  onSelect={handle}
/>
```

### The solution (compound)

```tsx
// ✅ Flexible, declarative, extensible
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

### Implementation skeleton

```tsx
const DropdownContext = createContext<DropdownContextType | null>(null);

export function Dropdown({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </DropdownContext.Provider>
  );
}

function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error('Must be used inside <Dropdown>');
  return ctx;
}

Dropdown.Trigger = function Trigger({ children }) {
  const { setOpen } = useDropdown();
  return <button onClick={() => setOpen((o) => !o)}>{children}</button>;
};

Dropdown.Content = function Content({ children }) {
  const { open } = useDropdown();
  if (!open) return null;
  return (
    <div className="absolute top-full right-0 z-50 bg-white shadow-md rounded">{children}</div>
  );
};

Dropdown.Item = function Item({ children, onSelect, variant = 'default' }) {
  const { setOpen } = useDropdown();
  return (
    <button
      className={cn('w-full px-4 py-2 text-left', variant === 'destructive' && 'text-red-600')}
      onClick={() => {
        onSelect?.();
        setOpen(false);
      }}
    >
      {children}
    </button>
  );
};

Dropdown.Separator = () => <hr className="my-1 border-gray-200" />;
```

**When to use**: Tabs, Accordions, Dropdowns, Selects, Card (Header/Body/Footer), DataTable rows.

---

## Pattern 3: Custom Hooks — Logic Encapsulation

Extract any hook body longer than a single `useState` into a named `useXxx` hook.

```typescript
// ✅ Encapsulated, reusable, testable
export function useAudioPlayer(url: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    return () => audio.pause();
  }, [url]);

  const toggle = () => {
    if (isPlaying) audioRef.current?.pause();
    else audioRef.current?.play();
    setIsPlaying((p) => !p);
  };

  return { isPlaying, duration, currentTime, toggle };
}
```

Common project hooks to have ready:

- `useAuth()` — wraps `useSession()`, exposes `user`, `hasRole()`, `logout()`
- `useDebounce(value, delay)` — for search inputs before API calls
- `usePagination(total, limit)` — page numbers, next/prev
- `useColumnVisibility()` — TanStack Table column toggle state

---

## Pattern 4: Provider Pattern — Scoped State Without Prop Drilling

Use for state shared across a route subtree (not app-wide — use Zustand for that).

```tsx
// providers/CampaignProvider.tsx
interface CampaignContextType {
  campaign: Campaign;
  updateStatus: (status: Campaign['status']) => void;
}

const CampaignContext = createContext<CampaignContextType | null>(null);

export function CampaignProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial: Campaign;
}) {
  const [campaign, setCampaign] = useState(initial);

  const updateStatus = useCallback((status: Campaign['status']) => {
    setCampaign((prev) => ({ ...prev, status }));
  }, []);

  // memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ campaign, updateStatus }), [campaign, updateStatus]);

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

// Always export a guard hook — never let consumers call useContext directly
export function useCampaign() {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error('useCampaign must be used inside <CampaignProvider>');
  return ctx;
}
```

Place providers in layout files so the entire route subtree can access them:

```tsx
// app/(dashboard)/campaigns/[id]/layout.tsx
export default async function Layout({ children, params }) {
  const campaign = await fetchCampaign(params.id);
  return <CampaignProvider initial={campaign}>{children}</CampaignProvider>;
}
```

---

## When to use which pattern

| Situation                                | Pattern                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| Component needs 4+ config props          | Compound Components                                    |
| Logic (state/effects/API) in a component | Extract to Custom Hook                                 |
| Multiple siblings need the same data     | Provider Pattern                                       |
| Page has both data + interactions        | Container (Server page) + Presenter (Client component) |
| Global data (auth, theme, toasts)        | Zustand store (not Provider)                           |

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
