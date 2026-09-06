import { describe, it, expect } from 'vitest';

import {
  BILLING_PLANS_ENDPOINT,
  BILLING_SUBSCRIPTION_ENDPOINT,
  BILLING_USAGE_ENDPOINT,
} from '../billing';

describe('billing endpoints', () => {
  it('mounts all three reads under /api/v1/billing/', () => {
    for (const url of [
      BILLING_PLANS_ENDPOINT,
      BILLING_SUBSCRIPTION_ENDPOINT,
      BILLING_USAGE_ENDPOINT,
    ]) {
      expect(url.startsWith('/api/v1/billing/')).toBe(true);
      expect(url.endsWith('/')).toBe(true);
    }
  });

  it('gives each endpoint its own path', () => {
    expect(
      new Set([BILLING_PLANS_ENDPOINT, BILLING_SUBSCRIPTION_ENDPOINT, BILLING_USAGE_ENDPOINT]).size
    ).toBe(3);
  });
});
