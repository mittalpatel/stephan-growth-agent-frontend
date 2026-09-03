import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import axiosPublic from '@/client/axiosPublic';
import { useSignupInvite } from '../useSignupInvite';

let mockParams: Record<string, string | null> = { token: 't0ken', email: 'jane@x.com' };

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (key: string) => mockParams[key] ?? null }),
}));

vi.mock('@/client/axiosPublic', () => ({
  default: { get: vi.fn() },
}));

function axiosErrorWithCode(code: string): AxiosError {
  return new AxiosError('Request failed', 'ERR', undefined, undefined, {
    data: { success: false, message: 'x', data: null, meta: {}, errors: { code } },
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
  } as never);
}

describe('useSignupInvite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = { token: 't0ken', email: 'jane@x.com' };
  });

  it('returns "missing" immediately when token/email are absent from the URL', () => {
    mockParams = { token: null, email: null };
    const { result } = renderHook(() => useSignupInvite());
    expect(result.current.status).toBe('missing');
    expect(axiosPublic.get).not.toHaveBeenCalled();
  });

  it('returns "valid" when validate-invite succeeds', async () => {
    vi.mocked(axiosPublic.get).mockResolvedValueOnce({ data: { success: true } });
    const { result } = renderHook(() => useSignupInvite());
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('valid'));
  });

  it.each([
    ['invite_invalid', 'invalid'],
    ['invite_expired', 'expired'],
    ['invite_used', 'used'],
  ])('maps errors.code=%s to status=%s', async (code, expected) => {
    vi.mocked(axiosPublic.get).mockRejectedValueOnce(axiosErrorWithCode(code));
    const { result } = renderHook(() => useSignupInvite());
    await waitFor(() => expect(result.current.status).toBe(expected));
  });

  it('falls back to "error" for an unrecognized error code', async () => {
    vi.mocked(axiosPublic.get).mockRejectedValueOnce(axiosErrorWithCode('something_else'));
    const { result } = renderHook(() => useSignupInvite());
    await waitFor(() => expect(result.current.status).toBe('error'));
  });
});
