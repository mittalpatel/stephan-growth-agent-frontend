---
name: performance
description: Guides performance optimization for this project. Use when optimizing bundle size, lazy loading heavy components, optimizing images, improving Core Web Vitals (LCP/CLS/FID), adding caching strategies, preventing unnecessary re-renders, or asking "why is my bundle large", "how do I speed up the page", "how do I fix layout shift", "should I memoize this".
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Performance Optimization — Senior Frontend Guidelines

## Performance Targets

| Metric                         | Target          |
| ------------------------------ | --------------- |
| LCP (Largest Contentful Paint) | < 2.5s          |
| FID (First Input Delay)        | < 100ms         |
| CLS (Cumulative Layout Shift)  | < 0.1           |
| Initial JS bundle              | < 200KB gzipped |

---

## 1. Bundle Optimization

### Analyze bundle

```bash
# Add to next.config.ts temporarily
ANALYZE=true next build
# Or: npm install @next/bundle-analyzer
```

### Tree-shaking — specific imports only

```typescript
// ❌ Imports entire lodash (70KB+)
import _ from 'lodash';
import * as Icons from 'lucide-react';

// ✅ Import only what you use
import sortBy from 'lodash/sortBy';
import { Search, Menu, ChevronDown } from 'lucide-react';
```

### Avoid barrel files for large feature modules

```typescript
// ❌ components/index.ts re-exporting everything — prevents tree shaking
export * from './WidgetsTable';
export * from './ChartDashboard'; // heavy chart gets bundled even if unused

// ✅ Direct named imports
import { WidgetsTable } from '@/components/widgets/WidgetsTable';
```

### Dynamic imports for heavy components

```typescript
import dynamic from 'next/dynamic'

// ✅ Charts, editors, maps, rich-text — always lazy load
const WidgetsChart = dynamic(() => import('@/components/widgets/WidgetsChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,  // chart.js needs window
})

const RichTextEditor = dynamic(() => import('@/components/common/RichTextEditor'), {
  loading: () => <EditorSkeleton />,
})
```

---

## 2. Image Optimization

```typescript
import Image from 'next/image'

// ✅ Always use next/image — never raw <img>
// Above-the-fold hero image
<Image
  src="/hero.jpg"
  alt="Dashboard hero"
  width={1200}
  height={600}
  priority                    // preloads — use only for LCP image
/>

// Responsive image inside a container
<div className="relative aspect-video">
  <Image
    src={widget.imageUrl}
    alt={widget.name}
    fill
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
    className="object-cover"
  />
</div>

// Blur placeholder for better perceived performance
<Image
  src="/team-photo.jpg"
  alt="Team"
  width={800}
  height={400}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

---

## 3. Font Optimization

```typescript
// app/layout.tsx — load fonts at the layout level, not in CSS @import
import { Poppins, Urbanist } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const urbanist = Urbanist({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html className={`${poppins.variable} ${urbanist.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

Remove `@import url("https://fonts.googleapis.com/...")` from `globals.css` if fonts are loaded via `next/font`.

---

## 4. Preventing Unnecessary Re-renders

```typescript
// ❌ New object reference every render → child always re-renders
function Parent() {
  const config = { theme: 'dark' }        // new object each render
  return <Child config={config} />
}

// ✅ Stable reference with useMemo
function Parent() {
  const config = useMemo(() => ({ theme: 'dark' }), [])
  return <Child config={config} />
}

// ✅ Stable callback with useCallback
function Parent({ onUpdate }) {
  const handleClick = useCallback((id: string) => {
    onUpdate(id)
  }, [onUpdate])
  return <Button onClick={handleClick} />
}

// ✅ Memoize context value to prevent all consumers re-rendering
const value = useMemo(() => ({ user, logout, hasRole }), [user, logout])
```

**Memoize only when:**

- The component renders frequently (e.g., inside a list)
- The prop is a derived object or function
- Profiler shows it as a bottleneck

Do not add `useMemo`/`useCallback` everywhere preemptively — it adds overhead.

---

## 5. Large List Virtualization

```typescript
import { FixedSizeList as List } from 'react-window'

// ✅ For lists with 100+ items
function VirtualWidgetsList({ widgets }: { widgets: Widget[] }) {
  return (
    <List
      height={600}
      itemCount={widgets.length}
      itemSize={64}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <WidgetRow widget={widgets[index]} />
        </div>
      )}
    </List>
  )
}
```

---

## 6. Preventing Layout Shift (CLS)

```typescript
// ❌ Image without dimensions causes CLS
<img src="/photo.jpg" alt="" />

// ✅ Fixed dimensions
<Image src="/photo.jpg" alt="" width={400} height={300} />

// ❌ Skeleton doesn't match final component height
if (isLoading) return <div className="h-20" />
return <div className="h-40">Content</div>

// ✅ Skeleton exactly matches final height
if (isLoading) return <div className="h-40 animate-pulse bg-muted rounded" />
return <div className="h-40">Content</div>
```

---

## 7. Non-Blocking Updates (useTransition)

```typescript
// ❌ Heavy filter computation blocks the UI
function Search() {
  const [query, setQuery] = useState('')
  const filtered = hugeList.filter(item => item.name.includes(query))

  return (
    <>
      <Input onChange={e => setQuery(e.target.value)} />
      <Results items={filtered} />
    </>
  )
}

// ✅ useTransition keeps the input responsive
function Search() {
  const [query, setQuery] = useState('')
  const [displayQuery, setDisplayQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    startTransition(() => setDisplayQuery(e.target.value))
  }

  const filtered = hugeList.filter(item => item.name.includes(displayQuery))

  return (
    <>
      <Input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <Results items={filtered} />
    </>
  )
}
```

---

## 8. Quick Performance Audit Checklist

```bash
# Check bundle size
npm run build && cat .next/analyze/client.html  # if bundle analyzer configured

# Find raw img tags (should all be next/image)
grep -rn "<img " src/ --include="*.tsx"

# Find missing dynamic imports for heavy components
grep -rn "from 'chart.js\|from '@tiptap\|from 'react-map" src/ --include="*.tsx" | grep -v "dynamic"

# Find barrel imports
grep -rn "import \* as\|import _" src/ --include="*.tsx" --include="*.ts"
```

---

## Reference files (load when needed)

## Further reading

The canonical rules for this topic live in the repo:

- `docs/topics/14-infra.md` — the reference
- `docs/INDEX.md` — every other topic, with a "read this when" line each
- `AGENTS.md` — the always-loaded rules, which take precedence over this skill

The earlier version of this section pointed at an external `frontend-context/`
guideline folder. That folder is developer-local and gitignored (see `AGENTS.md`),
so those links resolved for nobody — which is exactly how a skill teaches a reader
that its paths are approximate. In-repo docs are canonical: ADR-0012.
