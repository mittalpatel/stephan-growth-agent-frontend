'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { t } from '@/locales';
import { projectFileDetailEndpoint, projectFilesEndpoint, projectFilesKey } from '@/services/files';
import type { ProjectFile } from '@/types/file';

/**
 * One project's attached files: list, upload, rename, delete.
 *
 * Mirrors `useProjectAccess.ts`'s shape deliberately (`AGENTS.md`: a component
 * that calls `useMutation`, builds a request body, or maps API errors inline is
 * wrong) — a hand-rolled `useCallback` per action, backed by `useAuthMutation`'s
 * `mutateAsync`, with `applyApiError` + `toast` + `.refetch()` rather than
 * TanStack `useMutation` used directly in a component.
 */
export function useProjectFiles(projectId: string) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const filesQuery = useAuthQuery<{ data: ProjectFile[] }>(
    projectFilesKey(projectId),
    projectFilesEndpoint(projectId),
    { enabled: Boolean(projectId) }
  );

  const { mutateAsync: mutate } = useAuthMutation();

  const upload = useCallback(
    async (file: File, name: string) => {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);
        await mutate({
          url: projectFilesEndpoint(projectId),
          method: 'post',
          body: formData,
        });
        toast.success(t.projects.files.toast.uploaded);
        await filesQuery.refetch();
        return true;
      } catch (error) {
        applyApiError(error);
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [mutate, projectId, filesQuery]
  );

  const rename = useCallback(
    async (fileId: string, name: string) => {
      setPendingId(fileId);
      try {
        await mutate({
          url: projectFileDetailEndpoint(projectId, fileId),
          method: 'patch',
          body: { name },
        });
        toast.success(t.projects.files.toast.renamed);
        await filesQuery.refetch();
        return true;
      } catch (error) {
        applyApiError(error);
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [mutate, projectId, filesQuery]
  );

  const remove = useCallback(
    async (fileId: string) => {
      setPendingId(fileId);
      try {
        await mutate({
          url: projectFileDetailEndpoint(projectId, fileId),
          method: 'delete',
        });
        toast.success(t.projects.files.toast.deleted);
        await filesQuery.refetch();
        return true;
      } catch (error) {
        applyApiError(error);
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [mutate, projectId, filesQuery]
  );

  return {
    files: filesQuery.data?.data ?? [],
    isLoading: filesQuery.isLoading,
    isError: filesQuery.isError,
    refetch: filesQuery.refetch,
    pendingId,
    isUploading,
    upload,
    rename,
    remove,
  };
}
