import { describe, it, expect } from 'vitest';

import {
  INTEGRATIONS_ENDPOINT,
  integrationConnectEndpoint,
  integrationDisconnectEndpoint,
} from '../integrations';

const ID = 'crm-hubspot';

describe('integration endpoints', () => {
  it('builds the connect endpoint under the integrations root', () => {
    expect(integrationConnectEndpoint(ID)).toBe(`${INTEGRATIONS_ENDPOINT}${ID}/connect/`);
  });

  it('builds the disconnect endpoint under the integrations root', () => {
    expect(integrationDisconnectEndpoint(ID)).toBe(`${INTEGRATIONS_ENDPOINT}${ID}/disconnect/`);
  });
});
