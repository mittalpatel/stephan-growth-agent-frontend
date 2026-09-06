import { describe, it, expect } from 'vitest';

import {
  SETTINGS_AI_PREFERENCES_ENDPOINT,
  SETTINGS_BRAND_ENDPOINT,
  SETTINGS_DATA_DELETE_CONFIRM_ENDPOINT,
  SETTINGS_DATA_DELETE_ENDPOINT,
  SETTINGS_DATA_EXPORT_ENDPOINT,
  SETTINGS_ORGANIZATION_ENDPOINT,
  SETTINGS_SECURITY_ENDPOINT,
  settingsDataExportDownloadEndpoint,
} from '../settings';

const EXPORT_ID = 'b1c2d3e4-3333-4f5a-8b9c-0d1e2f3a4b5c';

describe('organization settings endpoints', () => {
  it('resolves every settings resource against the session tenant, no id in the path', () => {
    for (const url of [
      SETTINGS_ORGANIZATION_ENDPOINT,
      SETTINGS_BRAND_ENDPOINT,
      SETTINGS_AI_PREFERENCES_ENDPOINT,
      SETTINGS_SECURITY_ENDPOINT,
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
});
