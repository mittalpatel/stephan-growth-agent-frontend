import { describe, it, expect } from 'vitest';

import { authOptions } from '../auth/authOptions';

/**
 * `useSession().update()` is callable from client JavaScript, so whatever the
 * `jwt` callback accepts from it is whatever an XSS payload can write into the
 * session cookie.
 *
 * The organization switch and the change-password flow both mint a fresh backend
 * token pair. Both used to hand that pair to the browser and write it back through
 * `update({ access, refresh })` — putting a multi-day refresh token inside the
 * blast radius that the BFF proxy and the nonce CSP exist to shrink. Both now run
 * in server route handlers that write the cookie directly.
 *
 * These tests exist because restoring the leak is a one-line change in a callback
 * that otherwise looks like plumbing, and it cuts both ways: a client-writable
 * token slot lets an attacker inject a credential as easily as read one.
 */
describe('authOptions.jwt — what the client may write', () => {
  const jwt = authOptions.callbacks!.jwt!;

  const existing = {
    accessToken: 'server-issued-access',
    backendRefreshToken: 'server-issued-refresh',
    user: { id: 'u1', email: 'a@b.test' },
  };

  it('ignores an access token supplied through update()', async () => {
    const token = await jwt({
      token: { ...existing },
      trigger: 'update',
      session: { access: 'attacker-access' },
    } as never);

    expect((token as typeof existing).accessToken).toBe('server-issued-access');
  });

  it('ignores a refresh token supplied through update()', async () => {
    const token = await jwt({
      token: { ...existing },
      trigger: 'update',
      session: { refresh: 'attacker-refresh' },
    } as never);

    expect((token as typeof existing).backendRefreshToken).toBe('server-issued-refresh');
  });

  it('ignores tokens even when a legitimate user update rides along', async () => {
    // The shape the organization switch used to send.
    const token = (await jwt({
      token: { ...existing },
      trigger: 'update',
      session: {
        access: 'attacker-access',
        refresh: 'attacker-refresh',
        user: { id: 'u1', email: 'a@b.test', full_name: 'Renamed' },
      },
    } as never)) as typeof existing & { user: { full_name?: string } };

    expect(token.accessToken).toBe('server-issued-access');
    expect(token.backendRefreshToken).toBe('server-issued-refresh');
    // …while the display data it legitimately carries still lands.
    expect(token.user.full_name).toBe('Renamed');
  });

  it('still accepts the backend token pair at sign-in', async () => {
    // Sign-in is the server-side path: `user` is the credentials provider's
    // payload, not client input, and must still populate both tokens.
    // `account` is always present alongside `user` on a real initial sign-in
    // — see authOptions.ts's jwt callback, which now branches on
    // `account.provider` to also support social login (OIDC) sign-ins.
    const token = (await jwt({
      token: {},
      user: {
        access: 'fresh-access',
        refresh: 'fresh-refresh',
        user: { id: 'u1', email: 'a@b.test' },
      },
      account: { provider: 'credentials', type: 'credentials' },
    } as never)) as typeof existing;

    expect(token.accessToken).toBe('fresh-access');
    expect(token.backendRefreshToken).toBe('fresh-refresh');
  });

  it('accepts the backend token pair from a social-login (OIDC) sign-in', async () => {
    // The `signIn` callback verifies the provider's id_token with the backend
    // and stashes the result on `account` (the only channel to this
    // callback for that same sign-in) — see authOptions.ts.
    const token = (await jwt({
      token: {},
      account: {
        provider: 'google',
        type: 'oauth',
        backendAccess: 'oidc-fresh-access',
        backendRefresh: 'oidc-fresh-refresh',
        backendUser: { id: 'u1', email: 'a@b.test' },
      },
    } as never)) as typeof existing;

    expect(token.accessToken).toBe('oidc-fresh-access');
    expect(token.backendRefreshToken).toBe('oidc-fresh-refresh');
  });
});
