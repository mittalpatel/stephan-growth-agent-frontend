# Projects List

**Source:** `src/app/(restricted)/projects/page.tsx`

The reference implementation for a list page. Every other list in the app should be
built by copying this shape. Removed by `npm run strip-demo`. Replaces the earlier
`widgets` module 1:1 (same shape, `quantity` dropped, per-record access sharing added).

## File map

```
src/app/(restricted)/projects/
  page.tsx                          # Server: metadata + Suspense boundary
  hooks/
    useProjectsList.ts              # ALL list-page state — returns a flat props bag
    useProjectDetail.ts             # Single record (used by the detail route)
    useProjectAccess.ts             # Per-project access grants (used by the detail route)
  components/
    ProjectsList.tsx                # Orchestrates the four states
    ProjectsTable.tsx               # Table presenter
    ProjectsGrid.tsx                # Card presenter (mobile / dense)
    ProjectsSkeleton.tsx            # Loading shapes for both presenters
    __tests__/ProjectsTable.test.tsx

src/services/projects.ts            # Endpoints, query keys, param building
src/types/project.ts                # DTOs mirroring the backend serializers
src/lib/schemas/project.ts          # Zod schema for create/update
src/locales/en/projects.ts          # Every string this module renders
```

## page.tsx

Server component. Sets metadata from the catalog, then renders `<ProjectsList />`
inside a `Suspense` boundary.

The boundary is **required, not decorative**. `ProjectsList` reads the URL through
`useSearchParams`, and Next opts any route doing that out of static rendering unless
the read is inside a boundary. Without it the whole page becomes dynamic and the build
warns.

## useProjectsList

Owns everything: query params, the two network calls, and the derived toolbar props.
Returns one flat bag so the components below are pure presenters — no `useQuery`, no
request bodies, no error mapping in a component.

### URL is the source of truth

Page, search, sort, and filters live in the URL via `useQueryParams('projects')`, not
in `useState`. That makes a filtered list linkable, refresh-safe, and correct on
back-navigation.

Keys are namespaced — `projects_page`, `projects_sort`, `projects_search_by` — so a
second list on the same screen cannot collide with this one.

### Two queries, different cadence

| Query              | Key                            | Why separate                     |
| ------------------ | ------------------------------- | --------------------------------- |
| List rows          | `[PROJECTS_LIST_KEY, params]`   | Changes on every URL change       |
| `?type=parameters` | `[PROJECTS_PARAMETERS_KEY]`     | Filter config; `staleTime: 5min`  |

The parameters payload drives `FilterToolbar` entirely, so **adding a filter is a
backend-only change** — see `apps/projects/selectors/project_selector.py::build_parameters_config`.

The list key mirrors the request params exactly, so any URL change that alters the
request also alters the cache entry, and any change that does not, reuses it.
`placeholderData: (previous) => previous` keeps the current page rendered while the
next one loads, so paging does not flash empty.

## ProjectsList — four states, all designed

| State     | Renders                                                                  |
| --------- | ------------------------------------------------------------------------ |
| Loading   | `ProjectsTableSkeleton` / `ProjectsGridSkeleton`, shaped like the result |
| Error     | `EmptyState` with a retry button                                        |
| Empty     | Different copy for "nothing exists" vs "nothing matched"                |
| Populated | `ProjectsTable` or `ProjectsGrid`                                       |

The empty split matters: offering "clear filters" to someone with no filters set is
noise, and offering "create one" to someone whose search simply missed is misleading.
`hasActiveFilters` from the hook decides which.

View mode (table vs grid) is the one piece of state deliberately **not** in the URL —
it is a personal display preference, and putting it in the URL imposes your layout on
whoever you share the link with.

## Status tone mapping

`ProjectsTable` and `ProjectsGrid` each hold a `Record<ProjectStatus, StatusTone>`. The
mapping lives with the domain, not inside `StatusBadge`, so the shared component never
accumulates every module's vocabulary. Typing it as `Record<ProjectStatus, …>` means
adding a status fails the build here until it is given a tone.

`StatusBadge` receives an already-translated `label` — never the raw API value.

## API

| Method | Endpoint                                | Notes                                              |
| ------ | ---------------------------------------- | --------------------------------------------------- |
| GET    | `/api/v1/projects/`                      | List; params from `buildProjectListParams`          |
| GET    | `/api/v1/projects/?type=parameters`      | Filter and sort configuration                       |
| GET    | `/api/v1/projects/{id}/`                 | Detail; see the `[projectId]` doc                   |
| POST   | `/api/v1/projects/`                      | Create — requires `project:manage`                  |
| PATCH  | `/api/v1/projects/{id}/`                 | Update — requires `project:manage`                  |
| DELETE | `/api/v1/projects/{id}/`                 | Soft delete — requires `project:manage`             |
| GET    | `/api/v1/projects/{id}/access/`          | List access grants — requires `project:access_manage` |
| POST   | `/api/v1/projects/{id}/access/`          | Grant access — requires `project:access_manage`     |
| DELETE | `/api/v1/projects/{id}/access/`          | Revoke access — requires `project:access_manage`    |
| GET    | `/api/v1/projects/export/`               | Requires `project:export` — **not** implied by manage |

`execute`, `export`, and `access_manage` are all granted independently of `manage`.
Being able to edit a project's fields does not imply being trusted to grant or revoke
other people's access to it — see the `[projectId]` doc's Access section.

## Permissions

Route gated on `project` via `ROUTE_PERMISSIONS`. This is a UX affordance only — the
backend refuses the requests independently, and it is the only thing that actually
protects the data.

## Gotcha: the detail query key

`projectDetailKey` is exported from `src/services/projects.ts` and imported by **both**
`useProjectDetail` and the breadcrumb resolver in
`src/components/common/RestrictedBreadcrumb.tsx`.

Both must build the key from that one function. If they drift, the breadcrumb misses
the cache and silently refetches a record the page already has — no error, no visible
symptom, just a redundant request nobody notices until they profile the network tab.
