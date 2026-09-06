import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import { AxiosError, AxiosHeaders } from 'axios';
import axiosPublic from '@/client/axiosPublic';
import { DEFAULT_LANDING } from '@/constants/navItems';

import { usePublicSignupForm } from '../usePublicSignupForm';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/client/axiosPublic', () => ({
  default: { post: vi.fn() },
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

const detailsValues = {
  first_name: 'New',
  last_name: 'User',
  email: 'new@example.com',
  password: 'Passw0rd!',
  confirm_password: 'Passw0rd!',
};

describe('usePublicSignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts on the details step', () => {
    const { result } = renderHook(() => usePublicSignupForm());
    expect(result.current.step).toBe('details');
  });

  it('advances to the otp step after a successful signup submission', async () => {
    vi.mocked(axiosPublic.post).mockResolvedValueOnce({ data: { message: 'sent' } });
    const { result } = renderHook(() => usePublicSignupForm());

    act(() => {
      Object.entries(detailsValues).forEach(([key, value]) => {
        result.current.detailsForm.setValue(key as keyof typeof detailsValues, value);
      });
    });

    await act(() => result.current.onDetailsSubmit({ preventDefault: vi.fn() }));

    expect(result.current.step).toBe('otp');
    expect(result.current.email).toBe(detailsValues.email);
  });

  it('signs in immediately and skips the otp step when the backend returns a session', async () => {
    vi.mocked(axiosPublic.post).mockResolvedValueOnce({
      data: { message: 'Account created successfully.', data: { access_token: 'x' } },
    });
    vi.mocked(signIn).mockResolvedValueOnce({ ok: true, error: null, status: 200, url: null });
    const { result } = renderHook(() => usePublicSignupForm());

    act(() => {
      Object.entries(detailsValues).forEach(([key, value]) => {
        result.current.detailsForm.setValue(key as keyof typeof detailsValues, value);
      });
    });

    await act(() => result.current.onDetailsSubmit({ preventDefault: vi.fn() }));

    expect(result.current.step).toBe('details');
    expect(signIn).toHaveBeenCalledWith('credentials', {
      redirect: false,
      email: detailsValues.email,
      password: detailsValues.password,
    });
    expect(mockPush).toHaveBeenCalledWith(DEFAULT_LANDING);
  });

  it('binds a duplicate-email error to the email field', async () => {
    vi.mocked(axiosPublic.post).mockRejectedValueOnce(
      axiosErrorWithCode('email_already_registered')
    );
    const { result } = renderHook(() => usePublicSignupForm());

    act(() => {
      Object.entries(detailsValues).forEach(([key, value]) => {
        result.current.detailsForm.setValue(key as keyof typeof detailsValues, value);
      });
    });

    await act(() => result.current.onDetailsSubmit({ preventDefault: vi.fn() }));
    expect(result.current.step).toBe('details');
  });

  it('signs in and navigates to the default landing route after otp verification', async () => {
    vi.mocked(axiosPublic.post).mockResolvedValueOnce({ data: { message: 'sent' } });
    const { result } = renderHook(() => usePublicSignupForm());

    act(() => {
      Object.entries(detailsValues).forEach(([key, value]) => {
        result.current.detailsForm.setValue(key as keyof typeof detailsValues, value);
      });
    });
    await act(() => result.current.onDetailsSubmit({ preventDefault: vi.fn() }));

    vi.mocked(axiosPublic.post).mockResolvedValueOnce({ data: { message: 'verified' } });
    vi.mocked(signIn).mockResolvedValueOnce({ ok: true, error: null, status: 200, url: null });

    act(() => result.current.otpForm.setValue('otp', '123456'));
    await act(() => result.current.onOtpSubmit({ preventDefault: vi.fn() }));

    expect(mockPush).toHaveBeenCalledWith(DEFAULT_LANDING);
  });

  it('falls back to the login page when post-verification sign-in fails', async () => {
    vi.mocked(axiosPublic.post).mockResolvedValueOnce({ data: { message: 'sent' } });
    const { result } = renderHook(() => usePublicSignupForm());

    act(() => {
      Object.entries(detailsValues).forEach(([key, value]) => {
        result.current.detailsForm.setValue(key as keyof typeof detailsValues, value);
      });
    });
    await act(() => result.current.onDetailsSubmit({ preventDefault: vi.fn() }));

    vi.mocked(axiosPublic.post).mockResolvedValueOnce({ data: { message: 'verified' } });
    vi.mocked(signIn).mockResolvedValueOnce({
      ok: false,
      error: 'LOGIN_ERROR::nope',
      status: 401,
      url: null,
    });

    act(() => result.current.otpForm.setValue('otp', '123456'));
    await act(() => result.current.onOtpSubmit({ preventDefault: vi.fn() }));

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('resends the otp without changing the step', async () => {
    vi.mocked(axiosPublic.post).mockResolvedValueOnce({ data: { message: 'sent' } });
    const { result } = renderHook(() => usePublicSignupForm());
    act(() => {
      Object.entries(detailsValues).forEach(([key, value]) => {
        result.current.detailsForm.setValue(key as keyof typeof detailsValues, value);
      });
    });
    await act(() => result.current.onDetailsSubmit({ preventDefault: vi.fn() }));

    vi.mocked(axiosPublic.post).mockResolvedValueOnce({ data: { message: 'resent' } });
    await act(() => result.current.onResendOtp());

    expect(result.current.step).toBe('otp');
    expect(axiosPublic.post).toHaveBeenCalledTimes(2);
  });
});
