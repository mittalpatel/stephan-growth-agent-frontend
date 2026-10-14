'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { getEnvelope } from '@/lib/apiError';
import { getErrorCode } from '@/lib/helper';
import { format, formatFileSize } from '@/lib/i18n';
import { t } from '@/locales';
import {
  KNOWLEDGE_PDF_UPLOAD_ENDPOINT,
  KNOWLEDGE_UPLOAD_LIMITS_ENDPOINT,
  KNOWLEDGE_UPLOAD_LIMITS_KEY,
  knowledgeSourcesListKey,
} from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type { KnowledgeSource, KnowledgeUploadLimits } from '@/types/knowledge';

const BYTES_PER_MB = 1024 * 1024;

/**
 * Uploads a PDF as a new knowledge source. Multipart body, same pattern as
 * `useProjectFiles.upload`.
 *
 * Org-level: the upload takes no agent id, and the resulting source is
 * visible to every agent in the organization. `onCreated` is what keeps a
 * *narrowed* agent from losing sight of the source it just added — see
 * `useKnowledgeTargets.includeSource`.
 */
/** A readable reason for a refused upload: the wrong file type in plain
 * words, else the backend's own field or envelope message, else a generic
 * line. */
function uploadErrorMessage(error: unknown): string {
  if (getErrorCode(error) === 'upload_type_mismatch') return t.knowledge.addPdf.notPdf;
  const envelope = getEnvelope(error);
  const fileErrors = (envelope?.errors as { file?: unknown } | undefined)?.file;
  if (Array.isArray(fileErrors) && typeof fileErrors[0] === 'string') return fileErrors[0];
  const message = typeof envelope?.message === 'string' ? envelope.message.trim() : '';
  return message || t.knowledge.addPdf.uploadFailed;
}

export function useAddPdfSource(onCreated?: (sourceId: string) => void) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useAuthMutation<ApiResponse<KnowledgeSource>, FormData>();
  /** `KnowledgeSource.id` of the PDF that already covers this file's content
   * (matched by checksum), set only by a `duplicate_pdf_document` 409. Same
   * pattern as `useAddWebsiteFlow`'s `duplicateSourceId` (2026-09-12 fix). */
  const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(null);
  /** Why the last upload was refused, shown inside the dialog. A toast in
   * the far corner, worded "The submitted data is invalid" or "detected:
   * text/plain", was missed or not understood (client testing, 14 Oct 2026). */
  const [uploadError, setUploadError] = useState<string | null>(null);

  // The limit is a platform setting, so it is read rather than hardcoded.
  // Stated up front and checked on pick: it used to surface only after the
  // whole file had uploaded (client testing, 13 Oct 2026).
  const limitsQuery = useAuthQuery<ApiResponse<KnowledgeUploadLimits>>(
    [KNOWLEDGE_UPLOAD_LIMITS_KEY],
    KNOWLEDGE_UPLOAD_LIMITS_ENDPOINT,
    { staleTime: Infinity }
  );
  const limits = limitsQuery.data?.data ?? null;

  const upload = useCallback(
    async (file: File) => {
      setDuplicateSourceId(null);
      setUploadError(null);
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
          return false;
        }
        setUploadError(uploadErrorMessage(error));
        return false;
      }
    },
    [mutateAsync, onCreated, queryClient]
  );

  return {
    upload,
    isUploading: isPending,
    duplicateSourceId,
    uploadError,
    clearUploadError: () => setUploadError(null),
    /** "PDF only, up to 20 MB and 500 pages", or `null` until loaded. */
    limitsHint: limits
      ? format(t.knowledge.addPdf.limitsHint, {
          size: limits.max_pdf_size_mb,
          pages: limits.max_pdf_pages,
        })
      : null,
    /** Why `file` cannot be uploaded, or `null` when it can (or the limit is
     * not loaded yet; the backend still enforces it). */
    fileError: (file: File): string | null =>
      limits && file.size > limits.max_pdf_size_mb * BYTES_PER_MB
        ? format(t.knowledge.addPdf.tooLarge, {
            size: formatFileSize(file.size),
            limit: limits.max_pdf_size_mb,
          })
        : null,
  };
}
