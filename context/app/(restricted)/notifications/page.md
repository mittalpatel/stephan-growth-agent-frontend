# Notifications

**Source:** `src/app/(restricted)/notifications/page.tsx`

The full notification list (with filter/sort/pagination, mark-read/mark-all-read)
plus a preferences panel, backed by `apps/notifications` on the backend
(ADR-0016). Reachable only from the header bell's "View all" link — not a
sidebar entry, so it is registered via `PermissionGuard`'s `GLOBAL_PATHS` rather
than `ROUTE_PERMISSIONS`: the backend has no `required_permissions` on any
notifications endpoint (a notification belongs to its recipient, not a role), so
there is no resource for `ROUTE_PERMISSIONS` to gate on.

## File map

```
src/app/(restricted)/notifications/
  page.tsx                          # Server: metadata + Suspense boundary
  hooks/
    useNotificationsList.ts         # Paginated list state + mark-read/mark-all
    useNotificationPreferences.ts   # Per-event-type/channel preference get/set
  components/
    NotificationsView.tsx           # Orchestrates loading/error/empty/populated
    NotificationsSkeleton.tsx       # Loading shape
    NotificationPreferencesPanel.tsx

src/app/(restricted)/
  components/NotificationBell.tsx   # Header dropdown: unread badge + recent list
  hooks/useNotificationBell.ts      # Polled unread count + short recent list

src/services/notifications.ts       # Endpoints, query keys, param building, DTOs
```

The bell lives outside `notifications/` because `HeaderOne` renders it globally
across every restricted page, not just this one — it is a sibling of
`ImpersonationBanner.tsx` and `ProfilePopup.tsx` in that sense, not a child of
this route.

## Push, with polling as a fail-open backstop

`useRealtimeSocket` (mounted in `LayoutWrapper`, shared with the widget's other
live features) invalidates the bell's unread-count and recent-list queries the
moment a `notification` message arrives over the socket, so delivery is push in
the common case. `useNotificationBell` also polls unread count every 5 minutes
regardless, and the recent list on the same interval while the dropdown is open — see
`POLL_INTERVAL_MS`/`RECENT_LIMIT` — purely so the badge still catches up if the
socket never connected (blocked upgrade, channel-layer outage). This
supersedes ADR-0016's original polling-only stance; the ADR's reasoning against
standing up Channels for the bell alone no longer applies now that the app
maintains a realtime socket connection for other features regardless.

## The four production event types are EMAIL-only today

`copy.eventType` in `src/locales/en/notifications.ts` has labels for all four
(`organization_invite`, `organization_added`, `password_reset_otp`,
`signup_verification_otp`), but none of them currently produces an in-app row —
see the backend's ADR-0016 for why `organization_added` isn't the obvious first
candidate it looks like. The list/bell UI is fully built and tested against a
manually-created `Notification` row (verified live this session); it is simply
waiting on the first event type whose recipient is a confirmed member at
dispatch time.

## Preferences: required events are disabled client-side too

`NotificationPreferencesPanel`'s `NON_OPTIONAL` constant mirrors the backend's
`NON_OPTIONAL_EVENT_TYPES` — the switch is rendered `disabled` for those rows
so the user never fires a request the backend would 400 anyway. This is
UX-only: the backend (`NotificationService.set_preference`) is the actual
enforcement, and this constant drifting from it would only produce a confusing
disabled-but-not-really-enforced switch, not a security gap.
