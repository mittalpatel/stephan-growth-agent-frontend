'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { projectDetailEndpoint, projectDetailKey } from '@/services/projects';
import type { ApiResponse } from '@/types/api';
import type { Project } from '@/types/project';

/**
 * One project, by id.
 *
 * The key comes from `projectDetailKey` rather than being written inline, because
 * `RestrictedBreadcrumb` reads this exact cache entry to label the trailing
 * UUID segment. Both sides calling the same function is what keeps that working;
 * two hand-written arrays would drift and the only symptom would be a silent
 * extra request.
 */
export function useProjectDetail(projectId: string) {
  const query = useAuthQuery<ApiResponse<Project>>(
    projectDetailKey(projectId),
    projectDetailEndpoint(projectId),
    {
      enabled: Boolean(projectId),
      // A 404 here means the record is gone or forbidden — neither improves on
      // retry, and retrying just delays the not-found state the user should see.
      retry: (failureCount, error) => error.response?.status !== 404 && failureCount < 2,
    }
  );

  return {
    project: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isNotFound: query.error?.response?.status === 404,
    refetch: query.refetch,
  };
}
