/**
 * Global, dynamic API-error dispatcher.
 *
 * Every `/api/v1/*` endpoint answers with the standard envelope:
 *
 *     { success, message, data, meta, errors }
 *
 * On failure, `errors` can take one of three shapes — this module routes each to
 * the right surface (inline field error vs. toast) so call sites don't re-implement
 * the parsing every time:
 *
 *   1. Field-keyed validation (DRF serializer):
 *        errors: { current_password: ["Too short."], new_password: ["..."] }
 *      → each becomes an inline error on the matching form field.
 *
 *   2. Domain error with a stable, locale-independent code (ApplicationError):
 *        message: "La contraseña actual es incorrecta.", errors: { code: "wrong_password" }
 *      → mapped to a field via `codeFieldMap` (e.g. wrong_password → current_password)
 *        and shown inline; otherwise toasted.
 *
 *   3. No field detail (`errors: null` or a form-level `non_field_errors`):
 *        → toasted using `message`.
 *
 * See `context/api.md` → "Error envelope handling" for the backend contract and the
 * pending backend ask (field-scoped domain errors).
 */
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { t } from '@/locales';
import { getAxiosError } from '@/lib/helper';

export interface ApiErrorEnvelope {
  success?: boolean;
  message?: string | null;
  data?: unknown;
  meta?: unknown;
  // Field-keyed (`{ field: string[] }`), a domain code (`{ code: string }`), or null.
  errors?: Record<string, unknown> | null;
}

type FieldSetter<T> = (field: keyof T, error: { message: string }) => void;

export interface ApplyApiErrorOptions<T extends Record<string, unknown>> {
  /** React Hook Form's `setError`. When present, field-scoped errors render inline. */
  setError?: FieldSetter<T>;
  /**
   * Map a stable backend `errors.code` to a form field, e.g.
   * `{ wrong_password: 'current_password' }`. Lets a domain error that the backend
   * reports only as a `code` still land on the field it concerns.
   */
  codeFieldMap?: Partial<Record<string, keyof T>>;
  /**
   * The form's known fields. Any `errors` key not in this list is treated as
   * form-level and toasted instead of producing a phantom `setError` on a field
   * that doesn't exist. Omit to trust every key as a field.
   */
  fields?: ReadonlyArray<keyof T>;
  /** Channel for messages not bound to a field. Defaults to `toast.error`. */
  notify?: (message: string) => void;
  /**
   * Curated message shown when the response carries no envelope `message` (e.g. a
   * non-envelope failure, a blob-body error, a network error). Preferred over the
   * raw Axios message so call sites keep their localized copy.
   */
  fallbackMessage?: string;
}

/**
 * Read the `Retry-After` header (seconds) off a throttled 429, if the backend sent
 * one. Requires the header to be CORS-exposed (`Access-Control-Expose-Headers`) — it
 * is, server-side — otherwise cross-origin JS can't read it and this returns undefined.
 */
export function getRetryAfterSeconds(error: unknown): number | undefined {
  if (!(error instanceof AxiosError)) return undefined;
  const raw = error.response?.headers?.['retry-after'];
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : undefined;
}

/**
 * The user-facing rate-limit message: a countdown ("Try again in 42s.") when the
 * backend supplied `Retry-After`, otherwise the static fallback. Shared by
 * `applyApiError` (mutations) and `QueryProvider` (queries) so both surface 429s
 * identically.
 */
export function rateLimitMessage(error: unknown): string {
  const seconds = getRetryAfterSeconds(error);
  return seconds
    ? t.errors.rateLimitedRetry.replace('{seconds}', String(seconds))
    : t.errors.rateLimited;
}

/** Pull the standard envelope out of an Axios error, if present. */
export function getEnvelope(error: unknown): ApiErrorEnvelope | undefined {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data && typeof data === 'object') return data as ApiErrorEnvelope;
  }
  return undefined;
}

function firstMessage(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.find((v): v is string => typeof v === 'string');
  return undefined;
}

interface BindResult {
  /** True if at least one error was attached to a form field. */
  bound: boolean;
  /** A form-level message (non_field_errors or an unknown key) to toast, if any. */
  formLevelMessage?: string;
}

/** Attach field-keyed `errors` to form fields; return what couldn't be bound. */
function bindFieldErrors<T extends Record<string, unknown>>(
  errors: Record<string, unknown>,
  options: ApplyApiErrorOptions<T>,
  codeMessage: string
): BindResult {
  const { setError, codeFieldMap, fields } = options;
  if (!setError) return { bound: false };

  let bound = false;
  let formLevelMessage: string | undefined;

  // 1. Field-keyed validation / field-scoped domain errors: { field: ["msg"] }.
  for (const [key, value] of Object.entries(errors)) {
    if (key === 'code') continue;
    const fieldMessage = firstMessage(value);
    if (!fieldMessage) continue;
    // non_field_errors, or a key that isn't a real field on this form, can't bind.
    if (key === 'non_field_errors' || (fields && !fields.includes(key as keyof T))) {
      formLevelMessage ??= fieldMessage;
      continue;
    }
    setError(key as keyof T, { message: fieldMessage });
    bound = true;
  }

  // 2. Code-only domain error mapped to a field via the escape-hatch map.
  const code = typeof errors.code === 'string' ? errors.code : undefined;
  const mapped = code ? codeFieldMap?.[code] : undefined;
  if (!bound && mapped) {
    setError(mapped, { message: codeMessage });
    bound = true;
  }

  return { bound, formLevelMessage };
}

/**
 * Route an API error to inline field errors and/or a toast, based on the envelope.
 *
 * Pass `setError` (+ optionally `codeFieldMap`/`fields`) for forms; omit it and the
 * whole error simply toasts. Anything the function can't bind to a specific field
 * falls back to the toast channel, so an error is never silently swallowed.
 */
export function applyApiError<T extends Record<string, unknown>>(
  error: unknown,
  options: ApplyApiErrorOptions<T> = {}
): void {
  const { notify = (m) => toast.error(m), fallbackMessage } = options;

  // Throttled: show the rate-limit notice (with a countdown when the backend sent
  // Retry-After) rather than the raw DRF throttle text. There are no field errors to
  // bind on a 429, so toast and return.
  if (error instanceof AxiosError && error.response?.status === 429) {
    notify(rateLimitMessage(error));
    return;
  }

  const envelope = getEnvelope(error);
  const envelopeMessage = typeof envelope?.message === 'string' ? envelope.message.trim() : '';
  // Prefer the localized envelope message; then the caller's curated fallback; then
  // the raw Axios message; finally the generic copy.
  const message =
    envelopeMessage || fallbackMessage || getAxiosError(error) || t.errors.somethingWentWrong;

  const errors = envelope?.errors;
  const { bound, formLevelMessage } =
    errors && typeof errors === 'object'
      ? bindFieldErrors(errors, options, message)
      : { bound: false, formLevelMessage: undefined };

  // Anything not bound to a field surfaces as a toast.
  if (!bound) {
    notify(formLevelMessage ?? message);
  }
}
