# Organization Settings

**Source:** `src/app/(restricted)/organization/page.tsx`

Rename/delete the active organization, transfer ownership, and (read-only) view its
plan tier and seat limit.

## File map

```
src/app/(restricted)/organization/
  page.tsx                              # Server: metadata + renders OrganizationSettingsView
  components/
    OrganizationSettingsView.tsx        # Orchestrates form + danger zone + plan/seats
  hooks/
    useOrganizationSettingsForm.ts      # Rename + delete mutations
    useOrganizationPlan.ts              # Read-only plan tier + seat limit fetch
    useTransferOwnershipForm.ts         # Ownership transfer

src/services/organizations.ts           # Endpoints, query keys, OrganizationDetail type
```

## Plan tier and seat limit are read-only, fetched separately

`useOrganizationSettingsForm` gets `organization` (`{id, name, slug}`) from
`OrganizationContext`, which is session-derived and never carries `plan_tier` or
`seat_limit` — those only exist on the full `GET /organizations/{id}/` response
(`OrganizationDetail`). `useOrganizationPlan` fetches that separately via
`organizationDetailKey`/`organizationDetailEndpoint`, rather than folding it into
the settings-form hook, because it is display-only: there is no self-serve billing,
and `plan_tier` is an operator decision made in the Django admin (see the backend's
`OrganizationAdmin.save_model`, which audits changes to it). A `null` plan tier
renders as "No plan assigned"; a `null` seat limit renders as "Unlimited" — both mean
the organization is currently unmetered on that dimension, not that the field failed
to load.

## Settings tabs (simplified 2026-09-21)

`OrganizationSettingsView` wraps its content in `Tabs`: **General**, **Branding**,
**Data**, plus **Domains** only when `CUSTOM_DOMAINS_ENABLED` is on. Each tab owns
one settings resource, resolved against the session tenant
(`/api/v1/settings/{organization,brand,profile,domains}/` and `data/`; no
organization id in the URL, unlike every other endpoint on this page). The
`TabsList` still scrolls horizontally so a narrow viewport never wraps it.

Removed from the UI on 2026-09-21 because nothing on the backend reads them (the
backend team confirmed, and is removing them from the API after this ships): the
Features tab (feature flags), the AI preferences tab (approval-before-publishing,
auto-CRM-updates; the outreach approval toggle too, approval is always required),
the Security tab (`require_2fa`, `log_all_agent_actions`, so MFA is per user on the
profile page only), the Profile tab's legal name, phone and address fields, and, from
Branding, secondary color, tone of voice, company description and email sender name.
The backend still returns and accepts them until it ships its side; the frontend
neither sends nor reads them, and the PATCHes are partial. Secondary color and tone
stay in the API because the widget and agent defaults still read them
(`ThemeCascadeService`).

- **General**: name, slug, plan and seats, then a **Contact details** section
  (`OrganizationContactSection`/`useOrganizationProfileForm.ts`: website and contact
  email, its own form because it saves to `/settings/profile/`), then the danger zone.
- **Branding** (`BrandSettingsTab`/`useBrandSettingsForm.ts`; a save also invalidates the
  member-readable `GET /settings/brand/summary/` the app shell reads): logo and favicon
  images (`BrandImageField`/`useBrandImage.ts`: uploaded straight away to
  `POST /settings/brand/{logo,favicon}/` as multipart, needing `organization:manage`;
  logo PNG/JPEG/WebP up to 2 MB, favicon PNG/ICO up to 512 KB, SVG rejected, rules
  mirrored in `src/lib/constants/brandAssets.ts` as a courtesy while the backend
  re-checks the bytes; the backend stores the file and saves a backend-hosted URL,
  which is why it passes the CSP; Remove clears the URL through the ordinary PATCH;
  the form's reset keeps dirty values so an upload never wipes unsaved text), then
  `display_name` (client-validated as free text; a branding field rather than an edit
  to General's `name`, so rebranding never touches the slug), primary color
  (`RHFColorField`: a color swatch plus a hex box, so it can be picked or pasted;
  client-validated hex, mirroring the backend's `_validate_hex`; emails and the
  shell use it with the backend's readable text color) and `email_reply_to`.
- **Domains** (`DomainsTab`/`useOrganizationDomains.ts`; hidden unless
  `NEXT_PUBLIC_CUSTOM_DOMAINS_ENABLED=true`, set together with the backend's
  `CUSTOM_DOMAIN_ROUTING_ENABLED`). **Dormant by decision, 2026-09-21**: the product
  is not using domain-based organizations, so the flag stays off and this tab does not
  render. The code is kept rather than deleted in case that reverses; the same flag now
  also short-circuits `getPublicBranding` so nothing queries for domains while it is
  off. What follows describes the tab as built, for whoever turns it on: claim, verify,
  promote, and remove custom domains. `verify` is a real DNS TXT lookup: each
  pending row shows the record to publish (`dns_record`: type, name, value) and a
  "Check DNS record" button, which fails with the backend's own message until the
  record resolves. One status badge per row from `activation_status`:
  `pending_verification`, `awaiting_routing` (verified, but proxy/TLS serving is
  not switched on for it, so the app is not served from it yet) and `active`. A
  verified domain already brands the signed-out pages (see the layout doc). Client-side shape validation
  (`organizationDomainSchema` in `src/lib/schemas/settings.ts`) goes through
  the shared `isValidHostname()` in `src/lib/hostname.ts` (backend
  2026-09-07 extracted the equivalent `common/net/hostname.py` from what had
  been two independently-drifted regexes) — it now requires an
  alphabetic-only TLD, tighter than before, so e.g. `example.123` is
  rejected client-side, not just server-side. The same helper backs
  `agentDomainCreateSchema` (see
  `context/app/(restricted)/agents/[agentTypeSlug]/settings/page.md`), with
  `localhost` allowed there only, for local widget testing.
- **Data** (`DataSettingsTab`/`useOrganizationDataSettings.ts`): export
  history + request (`GET`/`POST /api/v1/settings/data/export/`) and delete
  (`POST .../data/delete/` emails a confirmation link).

### The bootstrap endpoint prefetches, but never replaces, the per-tab reads (2026-09-09)

`GET /api/v1/settings/bootstrap/` returns the settings in one response (the frontend
now reads only its `branding` and `profile`, and the organization detail). `useOrganizationSettingsBootstrap(organizationId)` (called once from
`OrganizationSettingsView`, regardless of which tab is active) fetches it and
seeds each tab's own query cache — `SETTINGS_BRAND_KEY`, `SETTINGS_PROFILE_KEY`,
plus `organizationDetailKey` (the same cache `useOrganizationPlan` reads for
plan tier/seat limit) — via `queryClient.setQueryData`, only when that key has
no entry yet (`existing ?? …`), so it never clobbers a fresher value a tab's
own `PATCH`/refetch already wrote.

Each tab's own hook is otherwise untouched: it still reads and writes through
its own endpoint and key, and still invalidates only that one key on save.
Radix `Tabs.Content` unmounts inactive panels by default, so before this
change opening Settings fired one request per tab as each was clicked; now
the bootstrap call fires once on mount and every tab after the first renders
from cache with no additional round trip. Domains stays a separate,
un-prefetched fetch — the bootstrap response deliberately excludes it.

All of these gate their editable controls on `organization:manage`, matching
the General tab's existing convention; Data's export/delete actions gate on the
more specific `organization:export`/`organization:delete` instead, since
they're independently-granted codes (see `AGENTS.md`'s `MANAGE_IMPLIED` note).

Three details in the Data tab are load-bearing rather than incidental:

- The export-history **read** is gated on `organization:export` via the
  query's own `enabled`, not just its section's visibility. The backend gates
  `OrgDataExportListCreateView`'s GET on that same code, so firing it
  unconditionally 403'd on every render for the ordinary member who can open
  this page but not export it.
- Downloads go through `src/lib/downloadBlob.ts`, not a hand-rolled object
  URL: it honours the server's `Content-Disposition` filename and, more
  importantly, parses the error Blob back into the standard envelope so
  `applyApiError` can surface the real message. The 404 an export that isn't
  `ready` returns is exactly that case, and without it the user gets a
  generic failure.
- A member holding only `organization:view` sees neither section, so the tab
  renders an explicit "no access" line instead of an unexplained blank body.

Each of the other three tabs renders `SettingsTabError` (a small shared
component) when its GET fails, rather than falling through to an empty form —
saving that form would overwrite real settings with blanks. Their `form.reset`
calls also pick the editable fields explicitly: every settings serializer also
returns a read-only `id`/`updated_at`, and spreading the response would park
those in form state and PATCH them straight back on every save.

`/organization/data-delete-confirm` (`DataDeleteConfirmView`) is a separate
page because the link is opened from an email, outside this session's normal
navigation. It reads `?token=` with `useSearchParams` (hence the `Suspense`
boundary in its `page.tsx` — Next requires one), explains itself rather than
showing a permanently disabled button when the token is missing, and on
success navigates to `DEFAULT_LANDING` and calls `router.refresh()`: the
session's active organization has just been deleted, so the restricted layout
must re-read the session rather than keep trusting the stale client copy —
the same move `useOrganizationSettingsForm.deleteOrganization` already makes.

## Member suspend/reactivate (Sprint-1 gap closure)

`/organization/members` (`MembersTable.tsx`/`useOrganizationMembers.ts`) gains
a status column and a suspend/reactivate icon button, gated `member:manage`:
`POST .../members/{userId}/suspend/` and `.../reactivate/`.
`OrganizationMember` gained `status: 'active'|'suspended'` and
`suspended_at`; the member list now includes suspended members (previously
implicitly excluded) — suspended is distinct from removed, so the row stays
visible with its role intact.

## Status

Complete.
