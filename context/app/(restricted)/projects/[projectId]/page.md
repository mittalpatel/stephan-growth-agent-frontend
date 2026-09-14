# Project Detail

**Source:** `src/app/(restricted)/projects/[projectId]/page.tsx`

The reference implementation for a detail page, including per-record access sharing.
Removed by `npm run strip-demo`.

## File map

```
src/app/(restricted)/projects/[projectId]/
  page.tsx                            # Server: awaits params, Suspense boundary
  hooks/
    useFilePreview.ts                  # Blob-URL preview for one attached file
  components/
    ProjectDetailsView.tsx            # Presenter — states + record layout + files + access section
    ProjectDetailSkeleton.tsx         # Matches the final layout
    ProjectFilesSection.tsx           # Per-project attached files: upload, list, preview, download
    ProjectAccessSection.tsx          # The "who has access" table

src/app/(restricted)/projects/hooks/
  useProjectDetail.ts                  # The single-record query
  useProjectFiles.ts                    # List/upload/rename/delete for this project's files
  useProjectAccess.ts                  # Access grants for this project id

src/services/files.ts                  # Project-scoped file endpoints + query keys
src/types/file.ts                      # ProjectFile DTO
src/lib/schemas/projectFile.ts         # Zod schema for the upload dialog's name field
```

## page.tsx — `params` is a Promise

```tsx
export default async function ProjectDetailPage({
  params,
}: Readonly<{ params: Promise<{ projectId: string }> }>) {
  const { projectId } = await params;
  ...
}
```

At Next 16 `params` is a Promise and must be awaited. Destructuring it directly is one
of the most common upgrade mistakes and fails at runtime, not at build. See
`node_modules/next/dist/docs/` before changing this signature.

## useProjectDetail

Builds its key with `projectDetailKey(id)` from `src/services/projects.ts` rather than
writing the array inline — the breadcrumb resolver reads this exact cache entry, and
the two can only stay aligned by calling the same function.

Retry is suppressed for 404:

```ts
retry: (failureCount, error) => error.response?.status !== 404 && failureCount < 2;
```

A missing or forbidden record does not become available on retry; retrying only delays
the not-found state the user should already be seeing.

## Three states, and why 404 is not an error

| Condition    | Renders                                               |
| ------------ | ----------------------------------------------------- |
| `isLoading`  | `ProjectDetailSkeleton`, shaped like the final layout |
| `isNotFound` | Not-found `EmptyState` with a link back to the list   |
| `isError`    | Error `EmptyState` **with** a retry                   |

A missing record and a failed request are different situations. Offering "try again"
on a 404 invites the user to retry something that cannot succeed.

## Layout

A `<dl>` of label/value rows — the correct element for a record — plus an optional
description panel. Dates go through `formatDateTime` from `src/lib/i18n.ts`; never
format a date by hand.

When `is_editable` is false (the backend computes this; archived projects are frozen)
an inline notice explains why, rather than silently disabling controls.

## Files section — per-project attachments

`ProjectFilesSection` renders below the record fields (and above the access section).
Files are **not** a top-level resource — every endpoint is nested under the owning
project (`src/services/files.ts`), there is no standalone `/files` route, and no
cross-project "all files" view. A file only ever appears inside its one parent
project's detail page.

### useProjectFiles

Same shape as `useProjectAccess`: a hand-rolled `useCallback` per action
(`upload`/`rename`/`remove`) backed by `useAuthMutation`'s `mutateAsync`, with
`applyApiError` + `toast` + `.refetch()`. `upload` posts `FormData` (`file` + `name`)
— `useAuthMutation`'s `body` goes straight to axios, so no special-casing is needed for
multipart; just don't force a JSON `Content-Type` header.

| Method | Endpoint                                         | Notes                          |
| ------ | ------------------------------------------------ | ------------------------------ |
| GET    | `/api/v1/projects/{id}/files/`                   | List                           |
| POST   | `/api/v1/projects/{id}/files/`                   | Upload — multipart             |
| PATCH  | `/api/v1/projects/{id}/files/{fileId}/`          | Rename only                    |
| DELETE | `/api/v1/projects/{id}/files/{fileId}/`          |                                |
| GET    | `/api/v1/projects/{id}/files/{fileId}/content/`  | Inline bytes, for preview      |
| GET    | `/api/v1/projects/{id}/files/{fileId}/download/` | Attachment bytes, for download |

### Upload dialog and dropzone

`UploadFileDialog` mirrors `CreateProjectDialog`'s controlled-`Dialog` shape. The
dropzone (drag-and-drop plus a hidden `<input type="file">` for click-to-browse) was
built from scratch here when nothing like it existed elsewhere in the repo; it now
lives in `src/components/common/Dropzone.tsx` and this section passes its own copy in
as props. It had to move once the PDF knowledge-source upload needed the same control:
this slice is the demo module, so `npm run strip-demo` would have taken a real
feature's dropzone with it. Only the display-name field goes through RHF + Zod
(`src/lib/schemas/projectFile.ts`); the picked `File` itself is plain `useState`, since
it isn't a form value. A client-side max-size check is a courtesy only — the backend
enforces the real limit.

### Preview — three branches

Clicking a file's name toggles an inline preview panel driven by `useFilePreview(id)`,
which fetches `content/` as a blob via the raw axios client, creates an object URL, and
revokes it on unmount or when the file id changes (see the effect in
`[projectId]/hooks/useFilePreview.ts` — never skip the cleanup, an unrevoked blob URL
leaks memory). It branches on `content_type`:

| `content_type`    | Renders                                             |
| ----------------- | --------------------------------------------------- |
| `image/*`         | `<img>` at the blob URL                             |
| `application/pdf` | `react-pdf`'s `<Document>`/`<Page>` at the blob URL |
| anything else     | A generic file icon + the Download button           |

The PDF branch (`PdfPreview` in `ProjectFilesSection.tsx`) is a real PDF.js render via
`react-pdf`, not a browser-native `<embed>` — prev/next page controls plus a "Page X of
Y" counter (`t.projects.files.pdf.pageOf`), and zoom +/- buttons driving `Page`'s
`scale` prop (state-managed, clamped 0.5x–2.5x). `Document`'s `loading`/`error`/
`onLoadError` props cover the fetch-succeeded-but-file-corrupt case (message:
`t.projects.files.previewLoadError`) — this is distinct from `useFilePreview`'s own
`isError`, which covers the authenticated fetch itself failing. The PDF.js worker is
wired up once, as a side-effect import, by `src/lib/pdfWorker.ts`, which points
`pdfjs.GlobalWorkerOptions.workerSrc` at `public/pdf.worker.min.mjs` — that file is a
manual copy of `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` (pdfjs-dist is a
transitive dep of `react-pdf`) and must be re-copied by hand if `react-pdf` is ever
upgraded to a version pinning a different `pdfjs-dist`. `react-pdf/dist/Page/
AnnotationLayer.css` and `TextLayer.css` are imported directly in
`ProjectFilesSection.tsx` for correct text/annotation-layer rendering.

The Download button (using `src/lib/downloadBlob.ts` against the `download/` endpoint)
always renders regardless of which preview branch fired, both in the preview panel and
per-row in the table.

### Access gating — UI convenience only

Upload/rename/delete are shown when `can('project', 'manage')` is true (org-wide,
effectively Owner/Admin), when the signed-in user is the project's owner, **or** when
their own row in `useProjectAccess(projectId).rows` (matched by id via `useSession()`,
same pattern as `OrganizationContext.tsx`, falling back to email) has `access_level`
`'editor'` or `'manager'`. A `'viewer'` grant or no grant at all still sees the list,
preview, and Download — just not the controls that change anything. This logic lives
inline in `ProjectFilesSection.tsx`, not as a shared hook, since nothing else needs it
yet. As with every client-side check in this app, it is a convenience: the backend
re-checks independently and is the only real enforcement point.

## Access section — per-project sharing

`ProjectAccessSection` renders below the record fields. It is gated on
`can('project', 'access_manage')` from `usePermissions()` — someone without that
permission never sees the section rendered at all, not a read-only version of it.
Visibility of _who has access_ is itself part of what the permission controls, mirroring
how the backend scopes the endpoint.

### useProjectAccess

Mirrors `useOrganizationMembers`'s shape deliberately: a hand-rolled `useCallback` per
action backed by `useAuthMutation`'s `mutateAsync`, with `applyApiError` + `toast` +
`.refetch()` — never a component calling `useMutation` directly or building a request
body inline (see `AGENTS.md`).

Two queries feed one merged row list:

| Query         | Source                                        | Purpose                                       |
| ------------- | --------------------------------------------- | --------------------------------------------- |
| Org roster    | `organizationMembersEndpoint(organizationId)` | Everyone who _could_ get access               |
| Access grants | `GET /api/v1/projects/{id}/access/`           | Who _currently_ has access, and at what level |

The hook left-joins the roster onto the grants by `user_id`: every member appears as a
row, defaulted to `'none'` unless a grant exists. That is what lets the table offer
"grant access" to someone who has never had any, not just "change level" to someone who
already does.

### Grant / revoke wiring

The row's `<Select>` offers `No access / Viewer / Editor / Manager`. Picking a level
other than "No access" calls `grantAccess` (`POST` with `{ user_id, access_level }`);
picking "No access" calls `revokeAccess` (`DELETE` with `{ user_id }` in the body, since
axios's `.delete()` takes a body via `config.data` — see `useAuthMutation`). Both route
through the single `changeAccess(userId, level)` entry point the component actually
calls.

`pendingUserId` disables the row's select while its own request is in flight, same
pattern as `MembersTable`'s per-row disable during a role change.
