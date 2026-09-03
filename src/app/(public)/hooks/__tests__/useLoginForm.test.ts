import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import { DEFAULT_LANDING } from '@/constants/navItems';

import { useLoginForm } from '../useLoginForm';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => null }),
}));

describe('useLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('initialises with empty fields and not loading', () => {
    const { result } = renderHook(() => useLoginForm());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.form.getValues()).toEqual({ email: '', password: '' });
  });

  it('toggles showPassword', () => {
    const { result } = renderHook(() => useLoginForm());
    expect(result.current.showPassword).toBe(false);
    act(() => result.current.toggleShowPassword());
    expect(result.current.showPassword).toBe(true);
  });

  it('navigates to the default landing route on successful sign-in', async () => {
    vi.mocked(signIn).mockResolvedValueOnce({ ok: true, error: null, status: 200, url: null });
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.form.setValue('email', 'user@test.com');
      result.current.form.setValue('password', 'secret123');
    });

    await act(() => result.current.onSubmit({ preventDefault: vi.fn() }));
    expect(mockPush).toHaveBeenCalledWith(DEFAULT_LANDING);
  });

  it('stores the challenge and redirects to /login/otp on mfa_required', async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: false,
      error: 'MFA_REQUIRED::abc.def.ghi',
      status: 200,
      url: null,
    });
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.form.setValue('email', 'user@test.com');
      result.current.form.setValue('password', 'secret123');
    });

    await act(() => result.current.onSubmit({ preventDefault: vi.fn() }));

    expect(mockPush).toHaveBeenCalledWith('/login/otp');
    expect(JSON.parse(sessionStorage.getItem('auth:mfaChallenge')!)).toEqual({
      challenge: 'abc.def.ghi',
      callbackUrl: null,
    });
  });

  it('shows toast error on failed sign-in', async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: false,
      error: 'LOGIN_ERROR::Credenciales inválidas',
      status: 401,
      url: null,
    });
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.form.setValue('email', 'user@test.com');
      result.current.form.setValue('password', 'wrongpass');
    });

    await act(() => result.current.onSubmit({ preventDefault: vi.fn() }));
    expect(toast.error).toHaveBeenCalledWith('Credenciales inválidas');
  });
});
