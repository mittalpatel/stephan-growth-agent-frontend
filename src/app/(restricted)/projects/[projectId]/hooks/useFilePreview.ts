'use client';

import { useEffect, useRef, useState } from 'react';

import axiosAuth from '@/client/axiosAuth';
import { projectFileContentEndpoint } from '@/services/files';

/**
 * Fetches one file's raw bytes as a blob and exposes an object URL to render
 * it inline (an `<img>` src, a PDF `<embed>` src, or `react-pdf`'s `<Document>`).
 *
 * `URL.createObjectURL` leaks memory if never revoked, so the previous URL is
 * revoked once it is superseded (or on unmount) — never pass the URL to a
 * persistent store, it is only valid for this hook's lifetime.
 *
 * The previous URL is deliberately NOT revoked in the per-run effect cleanup:
 * `react-pdf` fetches the blob URL asynchronously (unlike `<img>`/`<embed>`,
 * which read it synchronously on paint), so revoking eagerly on every effect
 * re-run — which also happens once per mount under React 18 Strict Mode's
 * dev-only double-invoke — can revoke the blob out from under a fetch that's
 * still in flight, surfacing as "Unexpected server response (0)".
 */
export function useFilePreview(projectId: string, fileId: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Nothing to fetch — leave the previous state alone here (no fileId means
    // no render will read `url` anyway, since the caller passes `null` only
    // when it means "nothing selected").
    if (!fileId) return;

    let cancelled = false;

    // Wrapped in its own async function (rather than setting state directly in
    // the effect body) so the loading/error resets below run as part of a
    // microtask continuation, not synchronously during the render commit —
    // `react-hooks/set-state-in-effect` flags the latter.
    async function loadPreview() {
      setIsLoading(true);
      setIsError(false);
      try {
        const response = await axiosAuth.get(projectFileContentEndpoint(projectId, fileId!), {
          responseType: 'blob',
        });
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(response.data as Blob);
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = objectUrl;
        setUrl(objectUrl);
      } catch {
        if (!cancelled) setIsError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [projectId, fileId]);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  // `fileId` being null means "nothing selected" — never surface a stale URL
  // from a previously previewed file in that case, even though the effect
  // above left `url` state untouched.
  return { url: fileId ? url : null, isLoading, isError };
}
