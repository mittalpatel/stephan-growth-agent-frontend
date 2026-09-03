# Restricted Layout

**Source:** `src/app/(restricted)/layout.tsx`

## Purpose

Server component auth guard + provider stack for all authenticated pages.

## Auth check

```ts
const session = await getServerSession(authOptions);
if (!session) redirect('/login');
```

## Provider stack (outermost → innermost)

| Provider               | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `UserContextProvider`  | Makes session/user object available via `useUserContext()`           |
| `NotificationProvider` | Fetches notifications, exposes `useNotifications()`                  |
| `ErrorContextProvider` | Global error boundary state                                          |
| `PreferencesProvider`  | IVA + timezone preference state — shared across ALL restricted pages |
| `LayoutWrapper`        | Renders Header + Sidebar + Breadcrumb + `<main>`                     |

`PreferencesProvider` is at this level so both the preferences page and order detail page share the same state — toggling IVA on one tab propagates instantly to the other via `localStorage` + `storage` event.

See [preferences-page context](../preferences/page.md) for full details on `PreferencesProvider`.
