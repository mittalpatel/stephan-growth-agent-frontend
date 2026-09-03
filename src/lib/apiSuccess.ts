/**
 * Global success-message dispatcher — the success-side mirror of `applyApiError`.
 *
 * Every `/api/v1/*` endpoint answers with the standard envelope:
 *
 *     { success, message, data, meta, errors }
 *
 * On success the backend supplies a localized `message` (it honors the request's
 * `Accept-Language`). Most call sites historically hardcoded their own copy and
 * threw that message away, so a dynamic backend message ("3 órdenes actualizadas",
 * "Sucursal desactivada") never reached the user. `applyApiSuccess` prefers the
 * envelope `message` and falls back to the caller's curated string.
 *
 * Accepts either the unwrapped envelope (what `useAuthMutation().mutateAsync`
 * resolves to) or a raw `AxiosResponse` (`{ data: envelope }`), so it works
 * regardless of which mutation wrapper produced the result.
 */
import { toast } from 'sonner';

interface SuccessEnvelope {
  message?: string | null;
  data?: unknown;
}

export interface ApplyApiSuccessOptions {
  /** Channel for the message. Defaults to `toast.success`. */
  notify?: (message: string) => void;
  /**
   * Curated message shown when the response carries no envelope `message`.
   * Also acts as the floor: if neither a message nor a fallback exists, nothing
   * is shown (a silent success is preferable to an empty toast).
   */
  fallbackMessage?: string;
}

/** Pull a string `message` out of an envelope or an AxiosResponse-wrapped envelope. */
function extractMessage(result: unknown): string | undefined {
  if (!result || typeof result !== 'object') return undefined;
  const direct = (result as SuccessEnvelope).message;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  // AxiosResponse shape: { data: { message } }
  const nested = (result as { data?: SuccessEnvelope }).data;
  if (nested && typeof nested === 'object' && typeof nested.message === 'string') {
    const trimmed = nested.message.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/**
 * Toast a success message, preferring the backend's localized envelope `message`
 * over the caller's curated `fallbackMessage`.
 *
 *     const res = await saveMutation.mutateAsync({ url, body });
 *     applyApiSuccess(res, { fallbackMessage: t.projects.toast.updated });
 */
export function applyApiSuccess(result: unknown, options: ApplyApiSuccessOptions = {}): void {
  const { notify = (m) => toast.success(m), fallbackMessage } = options;
  const message = extractMessage(result) ?? fallbackMessage;
  if (message) notify(message);
}
