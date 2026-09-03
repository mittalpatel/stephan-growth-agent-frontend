import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { toast } from 'sonner';
import { applyApiError, getRetryAfterSeconds, rateLimitMessage } from '@/lib/apiError';
import { t } from '@/locales';

function axios429(retryAfter?: string): AxiosError {
  const err = new AxiosError('Request failed with status code 429');
  err.response = {
    status: 429,
    data: { success: false, message: 'Request was throttled.', errors: null },
    statusText: 'Too Many Requests',
    headers: new AxiosHeaders(retryAfter ? { 'retry-after': retryAfter } : {}),
    config: { headers: new AxiosHeaders() },
  };
  return err;
}

describe('getRetryAfterSeconds', () => {
  it('reads a positive integer header', () => {
    expect(getRetryAfterSeconds(axios429('42'))).toBe(42);
  });

  it('rounds up fractional seconds', () => {
    expect(getRetryAfterSeconds(axios429('1.2'))).toBe(2);
  });

  it('returns undefined when the header is absent', () => {
    expect(getRetryAfterSeconds(axios429())).toBeUndefined();
  });

  it('returns undefined for a non-Axios error', () => {
    expect(getRetryAfterSeconds(new Error('nope'))).toBeUndefined();
  });
});

describe('rateLimitMessage', () => {
  it('builds a countdown message from Retry-After', () => {
    expect(rateLimitMessage(axios429('42'))).toBe(
      t.errors.rateLimitedRetry.replace('{seconds}', '42')
    );
  });

  it('falls back to the static message without a header', () => {
    expect(rateLimitMessage(axios429())).toBe(t.errors.rateLimited);
  });
});

describe('applyApiError on 429', () => {
  beforeEach(() => vi.clearAllMocks());

  it('toasts the countdown and never binds a field', () => {
    const setError = vi.fn();
    applyApiError(axios429('30'), { setError, fields: ['email'] });
    expect(toast.error).toHaveBeenCalledWith(t.errors.rateLimitedRetry.replace('{seconds}', '30'));
    expect(setError).not.toHaveBeenCalled();
  });

  it('toasts the static message when no Retry-After is present', () => {
    applyApiError(axios429());
    expect(toast.error).toHaveBeenCalledWith(t.errors.rateLimited);
  });
});
