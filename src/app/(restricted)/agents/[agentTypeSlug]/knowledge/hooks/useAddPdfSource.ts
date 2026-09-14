'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError, getEnvelope } from '@/lib/apiError';
import { getErrorCode } from '@/lib/helper';
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
  /** `KnowledgeSource.id` of the PDF that already covers this file's content
   * (matched by checksum), set only by a `duplicate_pdf_document` 409. Same
   * pattern as `useAddWebsiteFlow`'s `duplicateSourceId` (2026-09-12 fix). */
  const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setDuplicateSourceId(null);
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
        if (getErrorCode(error) === 'duplicate_pdf_document') {
          const existing = getEnvelope(error)?.errors as
            | { existing_source_id?: string }
            | undefined;
          setDuplicateSourceId(existing?.existing_source_id ?? null);
        }
        applyApiError(error);
        return false;
      }
    },
    [mutateAsync, onCreated, queryClient]
  );

  return { upload, isUploading: isPending, duplicateSourceId };
}
