'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import { agentPdfUploadEndpoint, knowledgeSourcesListKey } from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type { KnowledgeSource } from '@/types/knowledge';

/** Uploads a PDF as a new knowledge source. Multipart body, same pattern as
 * `useProjectFiles.upload`. */
export function useAddPdfSource(agentId: string) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useAuthMutation<ApiResponse<KnowledgeSource>, FormData>();

  const upload = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      try {
        await mutateAsync({ url: agentPdfUploadEndpoint(agentId), body: formData });
        void queryClient.invalidateQueries({ queryKey: knowledgeSourcesListKey(agentId) });
        return true;
      } catch (error) {
        applyApiError(error);
        return false;
      }
    },
    [agentId, mutateAsync, queryClient]
  );

  return { upload, isUploading: isPending };
}
