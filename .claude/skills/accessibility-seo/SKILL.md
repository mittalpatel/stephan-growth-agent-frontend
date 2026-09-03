---
name: accessibility-seo
description: Guides accessibility and SEO implementation for this project. Use when adding metadata, Open Graph tags, implementing ARIA labels, ensuring keyboard navigation, fixing screen reader issues, adding structured data, or asking "how do I add page title", "how do I make this accessible", "how do I add SEO meta tags", "is this keyboard navigable", "what aria attributes should I use".
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Accessibility & SEO — Senior Frontend Guidelines

---

## 1. Page Metadata (SEO)

Add `export const metadata` in every `page.tsx` and `layout.tsx`:

```typescript
// app/(dashboard)/widgets/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Widgets',                            // becomes "Widgets | SAFE" via template
  description: 'Manage and track all widgets',
  robots: { index: false, follow: false },     // don't index auth-protected pages
}

export default function WidgetsPage() {
  return <WidgetsClient />
}
```

### Root layout — title template and defaults

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'SAFE',
    template: '%s | SAFE', // page title becomes "Widgets | SAFE"
  },
  description: 'SAFE — Business Management Platform',
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  openGraph: {
    siteName: 'SAFE',
    type: 'website',
    locale: 'es_ES',
  },
};
```

### Dynamic metadata (detail pages)

```typescript
// app/(dashboard)/widgets/[widgetId]/page.tsx
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const widget = await widgetsService.getById(params.id);
  return {
    title: `Widget #${widget.widgetNumber}`,
    description: `Widget placed on ${widget.createdAt}`,
  };
}
```

### Open Graph (public-facing pages only)

```typescript
openGraph: {
  title: 'SAFE Dashboard',
  description: 'Manage widgets and widgets',
  images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'SAFE' }],
},
twitter: {
  card: 'summary_large_image',
  title: 'SAFE Dashboard',
  images: ['/og-image.png'],
},
```

---

## 2. Semantic HTML

Use the correct HTML element — it's the foundation of accessibility:

```tsx
// ✅ Semantic elements
<header>       — site/page header
<nav>          — navigation links
<main>         — primary page content (one per page)
<section>      — thematic grouping
<article>      — standalone content
<aside>        — supplementary content / sidebar
<footer>       — footer
<h1>–<h6>     — headings (don't skip levels)
<button>       — clickable actions
<a href>       — navigation links
<form>         — form wrapper
<table>        — tabular data (with <thead>, <tbody>, <th scope>)

// ❌ Never use div/span for interactive elements
<div onClick={handleClick}>Edit</div>   // no keyboard access, no role

// ✅ Use button
<button onClick={handleClick}>Edit</button>
```

---

## 3. ARIA Attributes

Only add ARIA when semantic HTML alone isn't enough:

```tsx
// Form fields — always associate label with input
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-required="true" aria-describedby="email-error" />
{error && <p id="email-error" role="alert" className="text-red-500 text-sm">{error}</p>}

// Icon-only buttons — must have accessible name
<button aria-label={t.actions.deleteWidget}>
  <Trash2 className="h-4 w-4" aria-hidden="true" />
</button>

// Loading state
<button disabled aria-busy="true">
  <Loader2 className="animate-spin" aria-hidden="true" />
  <span className="sr-only">{t.states.loading}</span>
</button>

// Expandable sections
<button aria-expanded={isOpen} aria-controls="filter-panel">
  Filters
</button>
<div id="filter-panel" hidden={!isOpen}>
  {/* filter content */}
</div>

// Live regions — for dynamic content updates
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

---

## 4. Keyboard Navigation

```tsx
// Every interactive element must be reachable by Tab
// Focus widget must follow visual layout

// ✅ Skip to content link (must be first focusable element)
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded"
>
  {t.a11y.skipToContent}
</a>

// ✅ Focus visible styles (don't remove outline)
// In globals.css or tailwind — never outline-none without a replacement
*:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

// ✅ Keyboard events for custom interactive elements
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
>
```

---

## 5. Images and Media

```tsx
// ✅ Meaningful alt text
<Image src="/widget-confirmed.png" alt="Widget confirmation checkmark" width={64} height={64} />

// ✅ Decorative images — empty alt (screen reader skips it)
<Image src="/divider.png" alt="" width={100} height={4} aria-hidden="true" />

// ✅ Complex images — long description
<Image src="/chart.png" alt="Revenue chart" aria-describedby="chart-desc" width={400} height={300} />
<p id="chart-desc" className="sr-only">Revenue increased 40% from Q1 to Q2 2025.</p>
```

---

## 6. Color and Contrast

- Text on background must meet WCAG AA: **4.5:1** for normal text, **3:1** for large text
- Never use color as the only visual distinction (add icon, text, or pattern)
- Test: `npx axe-cli http://localhost:3000/widgets`

```tsx
// ❌ Color-only status indication
<span className="text-red-500">Cancelled</span>

// ✅ Color + text + icon
<Badge variant="destructive">
  <XCircle className="mr-1 h-3 w-3" aria-hidden="true" />
  Cancelled
</Badge>
```

---

## 7. Accessibility Audit Commands

```bash
# Find missing alt text
grep -rn "<img\|<Image" src/ --include="*.tsx" | grep -v 'alt='

# Find click handlers on non-interactive elements
grep -rn "onClick" src/ --include="*.tsx" | grep -v "button\|a \|Link\|input\|select\|label"

# Find aria-label missing on icon buttons
grep -rn "<button" src/ --include="*.tsx" -A 2 | grep -B 1 "lucide\|Icon" | grep -v "aria-label"

# Find outline-none without replacement (kills focus visibility)
grep -rn "outline-none\|focus:outline-none" src/ --include="*.tsx" | grep -v "focus-visible"

# Run axe audit (install @axe-core/cli first)
npx axe http://localhost:3000
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
