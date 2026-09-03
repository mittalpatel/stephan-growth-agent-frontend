import { describe, it, expect } from 'vitest';

import { DEFAULT_LANGUAGE } from '@/config/language';

import axiosPublic from '../axiosPublic';

/**
 * The point of this client is what it does *not* do.
 *
 * `axiosPublic` serves the pre-login endpoints (forgot-password, OTP, invite
 * validation). If it ever grew a request interceptor that attached the session
 * token, or a 401 handler that tried to refresh, those flows would start sending
 * credentials to endpoints that must work without them — and an expired-session
 * refresh loop could fire on a page where nobody is signed in.
 */
describe('axiosPublic', () => {
  it('never attaches an Authorization header', () => {
    expect(axiosPublic.defaults.headers.common?.['Authorization']).toBeUndefined();
  });

  it('registers no request or response interceptors', () => {
    // Reaching into the private handler arrays is deliberate: the absence of an
    // interceptor is the invariant, and there is no public way to assert it.
    const request = (axiosPublic.interceptors.request as unknown as { handlers: unknown[] })
      .handlers;
    const response = (axiosPublic.interceptors.response as unknown as { handlers: unknown[] })
      .handlers;
    expect(request.filter(Boolean)).toHaveLength(0);
    expect(response.filter(Boolean)).toHaveLength(0);
  });

  it('sends the configured language so backend messages come back translated', () => {
    expect(axiosPublic.defaults.headers['Accept-Language']).toBe(DEFAULT_LANGUAGE);
  });

  it('targets the configured backend', () => {
    expect(axiosPublic.defaults.baseURL).toBe(process.env.NEXT_PUBLIC_BACKEND_API);
  });
});
