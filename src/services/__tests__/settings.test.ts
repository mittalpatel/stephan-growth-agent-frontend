import { describe, it, expect } from 'vitest';

import {
  SETTINGS_AI_PREFERENCES_ENDPOINT,
  SETTINGS_BRAND_ENDPOINT,
  SETTINGS_DATA_DELETE_CONFIRM_ENDPOINT,
  SETTINGS_DATA_DELETE_ENDPOINT,
  SETTINGS_DATA_EXPORT_ENDPOINT,
  SETTINGS_DOMAINS_ENDPOINT,
  SETTINGS_FEATURES_ENDPOINT,
  SETTINGS_ORGANIZATION_ENDPOINT,
  SETTINGS_PROFILE_ENDPOINT,
  SETTINGS_SECURITY_ENDPOINT,
  settingsDataExportDownloadEndpoint,
  settingsDomainDetailEndpoint,
  settingsDomainSetPrimaryEndpoint,
  settingsDomainVerifyEndpoint,
} from '../settings';

const EXPORT_ID = 'b1c2d3e4-3333-4f5a-8b9c-0d1e2f3a4b5c';
const DOMAIN_ID = 'c1d2e3f4-4444-4f5a-8b9c-0d1e2f3a4b5c';

describe('organization settings endpoints', () => {
  it('resolves every settings resource against the session tenant, no id in the path', () => {
    for (const url of [
      SETTINGS_ORGANIZATION_ENDPOINT,
      SETTINGS_BRAND_ENDPOINT,
      SETTINGS_AI_PREFERENCES_ENDPOINT,
      SETTINGS_SECURITY_ENDPOINT,
      SETTINGS_PROFILE_ENDPOINT,
      SETTINGS_FEATURES_ENDPOINT,
      SETTINGS_DOMAINS_ENDPOINT,
      SETTINGS_DATA_EXPORT_ENDPOINT,
      SETTINGS_DATA_DELETE_ENDPOINT,
      SETTINGS_DATA_DELETE_CONFIRM_ENDPOINT,
    ]) {
      expect(url.startsWith('/api/v1/settings/')).toBe(true);
      expect(url.endsWith('/')).toBe(true);
    }
  });

  it('builds the download endpoint from the export id', () => {
    expect(settingsDataExportDownloadEndpoint(EXPORT_ID)).toBe(
      `${SETTINGS_DATA_EXPORT_ENDPOINT}${EXPORT_ID}/download/`
    );
  });

  // Mirrors `settings_urls.py`'s domain routes. The detail route is the one
  // `DELETE` targets, so a missing trailing segment here would silently
  // delete nothing rather than fail loudly.
  it('builds every domain endpoint from the domain id', () => {
    expect(settingsDomainDetailEndpoint(DOMAIN_ID)).toBe(
      `${SETTINGS_DOMAINS_ENDPOINT}${DOMAIN_ID}/`
    );
    expect(settingsDomainVerifyEndpoint(DOMAIN_ID)).toBe(
      `${SETTINGS_DOMAINS_ENDPOINT}${DOMAIN_ID}/verify/`
    );
    expect(settingsDomainSetPrimaryEndpoint(DOMAIN_ID)).toBe(
      `${SETTINGS_DOMAINS_ENDPOINT}${DOMAIN_ID}/set-primary/`
    );
  });
});
