'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import { KNOWLEDGE_PDF_UPLOAD_ENDPOINT, knowledgeSourcesListKey } from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type { KnowledgeSource } from '@/types/knowledge';

/**
 * Uploads a PDF as a new knowledge source. Multipart body, same pattern as
 * `useProjectFiles.upload`.
 *
 * Org-level: the upload takes no agent id, and the resulting source is
 * visible to every agent in the organization. `onCreated` is what keeps a
 * *narrowed* agent from losing sight of the source it just added — see
 * `useKnowledgeTargets.includeSource`.
 */
export function useAddPdfSource(onCreated?: (sourceId: string) => void) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useAuthMutation<ApiResponse<KnowledgeSource>, FormData>();

  const upload = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await mutateAsync({
          url: KNOWLEDGE_PDF_UPLOAD_ENDPOINT,
          body: formData,
        });
        void queryClient.invalidateQueries({ queryKey: knowledgeSourcesListKey() });
        onCreated?.(response.data.id);
        return true;
      } catch (error) {
        applyApiError(error);
        return false;
      }
    },
    [mutateAsync, onCreated, queryClient]
  );

  return { upload, isUploading: isPending };
}
