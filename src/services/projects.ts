/**
 * Project endpoints and query keys.
 *
 * A service module owns three things and nothing else: the endpoint strings, the
 * query keys, and the param-building. No React, no state, no fetching — the
 * hooks in `src/app/(restricted)/projects/hooks/` do that. Keeping them separate
 * is what lets a key be reused from somewhere that is not the list page (the
 * breadcrumb resolver, say) without importing a hook.
 *
 * Removed wholesale by `npm run strip-demo`.
 */
import { buildListParams, type ListQuery } from './listParams';

export const PROJECTS_ENDPOINT = '/api/v1/projects/';

export const projectDetailEndpoint = (id: string) => `${PROJECTS_ENDPOINT}${id}/`;
export const projectAccessEndpoint = (id: string) => `${PROJECTS_ENDPOINT}${id}/access/`;
export const projectAccessRevokeEndpoint = (id: string, userId: string) =>
  `${projectAccessEndpoint(id)}${userId}/`;
/** The caller's own standing on a project — `project:view`-gated, unlike the
 * roster (`projectAccessEndpoint`), which requires `project:access_manage`. */
export const projectAccessMineEndpoint = (id: string) => `${projectAccessEndpoint(id)}mine/`;
export const PROJECTS_EXPORT_ENDPOINT = `${PROJECTS_ENDPOINT}export/`;

/**
 * Query keys.
 *
 * `projectDetailKey` is imported by `RestrictedBreadcrumb`'s resolver as well as
 * the detail hook. That is the point of exporting it: the breadcrumb reads the
 * detail page's cached record instead of refetching it, and it can only do that
 * if both sides build the key from this one function. Two hand-written arrays
 * that happen to match today will silently stop matching, and the only symptom
 * is a redundant request nobody notices.
 */
export const PROJECTS_LIST_KEY = 'projects-list';
export const PROJECTS_PARAMETERS_KEY = 'projects-parameters';

export const projectDetailKey = (id: string) => ['project-detail', id];
export const projectAccessKey = (id: string) => ['project-access', id];
export const projectAccessMineKey = (id: string) => ['project-access-mine', id];

/**
 * Project list query and encoder.
 *
 * Both are the shared implementations in `./listParams`, aliased here so the
 * existing call sites keep reading in project terms. The encoding itself is not
 * project-specific and must not be copied per resource — see `buildListParams`.
 */
export type ProjectListQuery = ListQuery;
export const buildProjectListParams = buildListParams;

/** Serialize params onto the endpoint. Kept here so the key and URL agree. */
export function projectListUrl(query: ProjectListQuery): string {
  const search = new URLSearchParams(
    Object.entries(buildProjectListParams(query)).map(([key, value]) => [key, String(value)])
  );
  return `${PROJECTS_ENDPOINT}?${search.toString()}`;
}

/** The `?type=parameters` request that drives `FilterToolbar`'s filter configs. */
export const PROJECTS_PARAMETERS_URL = `${PROJECTS_ENDPOINT}?type=parameters`;

/**
 * The searchable columns offered to the backend's `search`/`search_by` pair.
 *
 * Must be a subset of `_SEARCH_FIELDS` in
 * `apps/projects/selectors/project_selector.py` — the backend ignores any column
 * it does not recognise, so a typo here degrades to "search silently does
 * nothing" rather than an error.
 */
export const PROJECT_SEARCH_COLUMNS = ['name', 'description'];
