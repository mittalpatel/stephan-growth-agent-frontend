/**
 * Project-scoped file endpoints and query keys.
 *
 * Files are not a top-level resource — every endpoint is nested under one
 * project, mirroring the backend's `apps/projects/api/v1/urls.py` nesting. A
 * service module owns three things and nothing else: the endpoint strings, the
 * query keys, and (where relevant) the param-building. No React, no state, no
 * fetching — `src/app/(restricted)/projects/hooks/useProjectFiles.ts` does that.
 */
import { projectDetailEndpoint } from './projects';

export const projectFilesEndpoint = (projectId: string) =>
  `${projectDetailEndpoint(projectId)}files/`;

export const projectFileDetailEndpoint = (projectId: string, fileId: string) =>
  `${projectFilesEndpoint(projectId)}${fileId}/`;

export const projectFileContentEndpoint = (projectId: string, fileId: string) =>
  `${projectFileDetailEndpoint(projectId, fileId)}content/`;

export const projectFileDownloadEndpoint = (projectId: string, fileId: string) =>
  `${projectFileDetailEndpoint(projectId, fileId)}download/`;

/** Query key for the file list of one project. */
export const projectFilesKey = (projectId: string) => ['project-files', projectId];
