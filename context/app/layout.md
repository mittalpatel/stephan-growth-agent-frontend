# Root Layout

**Source:** `src/app/layout.tsx`

## Purpose

Top-level HTML shell. Applies fonts, global CSS, and wraps the entire app in shared providers.

## Providers (outermost → innermost)

| Provider          | Source                        | Purpose                                           |
| ----------------- | ----------------------------- | ------------------------------------------------- |
| `SessionProvider` | `@/providers/SessionProvider` | Makes NextAuth session available via `useSession` |
| `QueryProvider`   | `@/providers/QueryProvider`   | TanStack Query client                             |
| `ThemeProvider`   | `@/providers/ThemeProvider`   | Dark/light theme (shadcn)                         |
| `LoaderProvider`  | `@/providers/LoaderProvider`  | Global page-load spinner                          |
| `<Toaster>`       | sonner                        | Top-right toast notifications                     |

## Fonts

Geist Sans + Geist Mono via `next/font/google`. Applied as CSS variables `--font-geist-sans` / `--font-geist-mono`.

## Metadata

`title.template: '%s | SAFE'` — all child pages just set `title: 'Page Name'` and get `Page Name | SAFE` automatically.

## Root page.tsx

`src/app/page.tsx` immediately redirects to `/login`.
