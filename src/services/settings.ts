/**
 * Organization settings endpoints — resolved against the session tenant, not
 * a URL organization id. Mirrors `apps/organizations/api/v1/{views,serializers}/settings.py`
 * and `settings_data.py`.
 */
export const SETTINGS_ORGANIZATION_ENDPOINT = '/api/v1/settings/organization/';
export const SETTINGS_BRAND_ENDPOINT = '/api/v1/settings/brand/';
export const SETTINGS_PROFILE_ENDPOINT = '/api/v1/settings/profile/';
export const SETTINGS_FEATURES_ENDPOINT = '/api/v1/settings/features/';
export const SETTINGS_AI_PREFERENCES_ENDPOINT = '/api/v1/settings/ai-preferences/';
export const SETTINGS_SECURITY_ENDPOINT = '/api/v1/settings/security/';
/**
 * Every settings tab except domains, in one response (backend 2026-09-06's
 * `OrganizationSettingsBootstrapView`). Used only to prefetch and seed the
 * individual tabs' own query caches on mount — each tab still reads/writes
 * through its own endpoint and key above, so a save only invalidates the one
 * tab it touched rather than this combined shape.
 */
export const SETTINGS_BOOTSTRAP_ENDPOINT = '/api/v1/settings/bootstrap/';

export const SETTINGS_DOMAINS_ENDPOINT = '/api/v1/settings/domains/';
export const settingsDomainDetailEndpoint = (id: string) => `${SETTINGS_DOMAINS_ENDPOINT}${id}/`;
export const settingsDomainVerifyEndpoint = (id: string) =>
  `${SETTINGS_DOMAINS_ENDPOINT}${id}/verify/`;
export const settingsDomainSetPrimaryEndpoint = (id: string) =>
  `${SETTINGS_DOMAINS_ENDPOINT}${id}/set-primary/`;

export const SETTINGS_DATA_EXPORT_ENDPOINT = '/api/v1/settings/data/export/';
export const settingsDataExportDownloadEndpoint = (id: string) =>
  `${SETTINGS_DATA_EXPORT_ENDPOINT}${id}/download/`;
export const SETTINGS_DATA_DELETE_ENDPOINT = '/api/v1/settings/data/delete/';
export const SETTINGS_DATA_DELETE_CONFIRM_ENDPOINT = '/api/v1/settings/data/delete/confirm/';

export const SETTINGS_BRAND_KEY = 'settings-brand';
export const SETTINGS_PROFILE_KEY = 'settings-profile';
export const SETTINGS_FEATURES_KEY = 'settings-features';
export const SETTINGS_DOMAINS_KEY = 'settings-domains';
export const SETTINGS_AI_PREFERENCES_KEY = 'settings-ai-preferences';
export const SETTINGS_SECURITY_KEY = 'settings-security';
export const SETTINGS_DATA_EXPORT_KEY = 'settings-data-export';
export const SETTINGS_BOOTSTRAP_KEY = 'settings-bootstrap';
