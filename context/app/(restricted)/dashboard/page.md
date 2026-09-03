# Dashboard

**Source:** `src/app/(restricted)/dashboard/page.tsx`

A deliberately empty landing page — the value is in _where_ it sits, not what it shows.

`DEFAULT_LANDING` in `src/constants/navItems.ts` points here, and the proxy, the
post-login redirect, and `safeRedirect`'s fallback all read that constant. Keep this
route reachable by **every** authenticated user regardless of role: it has no
`requiredFunction` and no `ROUTE_PERMISSIONS` entry, so nothing can gate it.

Pointing `DEFAULT_LANDING` at a permission-gated page instead sends anyone lacking that
permission into a redirect loop — the app bounces them to a page it then refuses.

Replace the placeholder content with whatever your product's home screen should be.
