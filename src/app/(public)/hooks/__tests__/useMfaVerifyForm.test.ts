import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { signIn } from 'next-auth/react';

import { useMfaVerifyForm } from '../useMfaVerifyForm';
import { readMfaChallenge, saveMfaChallenge } from '../mfaChallengeStorage';

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

describe('useMfaVerifyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockSearchParams = new URLSearchParams();
  });

  it('redirects to /login when no challenge is stored', async () => {
    renderHook(() => useMfaVerifyForm('otp'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login'));
  });

  it('picks up a ?challenge= query param (social-login MFA hand-off) into storage', async () => {
    mockSearchParams = new URLSearchParams({ challenge: 'from-oidc-signin' });
    renderHook(() => useMfaVerifyForm('otp'));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login/otp'));
    expect(readMfaChallenge()?.challenge).toBe('from-oidc-signin');
    // Not treated as "no challenge" while the hand-off is in flight, even
    // though the pre-hand-off render still had nothing in storage.
    expect(mockReplace).not.toHaveBeenCalledWith('/login');
  });

  it('is ready and does not redirect when a challenge is stored', async () => {
    saveMfaChallenge('token-abc', '/dashboard');
    const { result } = renderHook(() => useMfaVerifyForm('otp'));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('clears the challenge and redirects to the callback URL on success', async () => {
    saveMfaChallenge('token-abc', '/dashboard');
    vi.mocked(signIn).mockResolvedValueOnce({ ok: true, error: null, status: 200, url: null });
    const { result } = renderHook(() => useMfaVerifyForm('otp'));
    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => result.current.form.setValue('code', '123456'));
    await act(() => result.current.onSubmit({ preventDefault: vi.fn() }));

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    expect(sessionStorage.getItem('auth:mfaChallenge')).toBeNull();
  });

  it('shows the TOTP-flavored message for a wrong code on the otp page', async () => {
    saveMfaChallenge('token-abc', null);
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: false,
      error: "MFA_RETRY::mfa_invalid_code::That code didn't match. Check the time on your device and try again.",
      status: 400,
      url: null,
    });
    const { result } = renderHook(() => useMfaVerifyForm('otp'));
    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => result.current.form.setValue('code', '000000'));
    await act(() => result.current.onSubmit({ preventDefault: vi.fn() }));

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    // `getFieldState` reads the form's internal state directly rather than
    // through `formState`'s subscription proxy, which only starts tracking a
    // field once something renders it — true in the real `MfaVerifyForm`
    // presenter, not in this hook-only test.
    expect(result.current.form.getFieldState('code').error?.message).toBe(
      "That code didn't match. Check the time on your device and try again."
    );
    // The challenge survives a retryable failure — the user can try again.
    expect(sessionStorage.getItem('auth:mfaChallenge')).not.toBeNull();
  });

  it('shows recovery-code-flavored copy, not TOTP wording, for a wrong code on the backup-code page', async () => {
    saveMfaChallenge('token-abc', null);
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: false,
      error: "MFA_RETRY::mfa_invalid_code::That code didn't match. Check the time on your device and try again.",
      status: 400,
      url: null,
    });
    const { result } = renderHook(() => useMfaVerifyForm('backup-code'));
    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => result.current.form.setValue('code', 'wrongcode'));
    await act(() => result.current.onSubmit({ preventDefault: vi.fn() }));

    const message = result.current.form.getFieldState('code').error?.message;
    expect(message).toBe('That recovery code is incorrect or has already been used.');
    expect(message).not.toMatch(/device/i);
  });

  it('clears the challenge and redirects to /login on a fatal error', async () => {
    saveMfaChallenge('token-abc', null);
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: false,
      error: 'MFA_FATAL::This verification attempt has expired.',
      status: 400,
      url: null,
    });
    const { result } = renderHook(() => useMfaVerifyForm('otp'));
    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => result.current.form.setValue('code', '000000'));
    await act(() => result.current.onSubmit({ preventDefault: vi.fn() }));

    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(sessionStorage.getItem('auth:mfaChallenge')).toBeNull();
  });

  it('backToLogin clears the challenge and navigates to /login', async () => {
    saveMfaChallenge('token-abc', null);
    const { result } = renderHook(() => useMfaVerifyForm('otp'));
    await waitFor(() => expect(result.current.ready).toBe(true));

    act(() => result.current.backToLogin());

    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(sessionStorage.getItem('auth:mfaChallenge')).toBeNull();
  });
});
