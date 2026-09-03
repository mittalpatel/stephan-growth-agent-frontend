import { AxiosError } from 'axios';
import axiosAuth from '@/client/axiosAuth';

// Fetches a binary response (CSV/PDF) from an authenticated endpoint and triggers
// a browser download. Use it for any CSV/PDF export endpoint that streams bytes
// rather than returning JSON.
export async function downloadBlob(
  url: string,
  fallbackFilename: string,
  options?: { method?: 'get' | 'post'; body?: unknown }
): Promise<void> {
  const method = options?.method ?? 'get';
  try {
    const response =
      method === 'post'
        ? await axiosAuth.post(url, options?.body, { responseType: 'blob' })
        : await axiosAuth.get(url, { responseType: 'blob' });

    // Try to honour the server-provided filename
    const disposition = response.headers['content-disposition'] as string | undefined;
    const match = disposition?.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] ?? fallbackFilename;

    const blobUrl = window.URL.createObjectURL(response.data as Blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    // On failure the body is still a Blob (we asked for `responseType: 'blob'`),
    // so the standard `{ success, message, errors }` envelope is hidden inside it
    // and `applyApiError` — which reads `error.response.data` synchronously — would
    // only see an unreadable Blob and fall back to a generic message. Parse the
    // Blob to JSON here and re-assign it so the error propagates as a normal
    // envelope and every export site's `catch → applyApiError` surfaces the real
    // backend message with no per-call-site handling.
    await normalizeBlobError(error);
    throw error;
  }
}

async function normalizeBlobError(error: unknown): Promise<void> {
  if (!(error instanceof AxiosError) || !(error.response?.data instanceof Blob)) return;
  try {
    const text = await error.response.data.text();
    error.response.data = JSON.parse(text);
  } catch {
    // Body wasn't JSON (e.g. an HTML error page) — leave it as-is; applyApiError
    // will fall back to the caller's fallbackMessage.
  }
}
