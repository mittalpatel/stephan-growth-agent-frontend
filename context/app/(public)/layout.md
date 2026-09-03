# Public Layout

**Source:** `src/app/(public)/layout.tsx`

## Purpose

Server component guard for unauthenticated routes. If a session already exists, redirects to `/orders` so logged-in users never see the login page.

## Auth check

```ts
const session = await getServerSession(authOptions);
if (session) redirect('/orders');
```
