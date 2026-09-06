/**
 * Organization settings DTOs — mirrors
 * `apps/organizations/api/v1/serializers/{settings,settings_data}.py` field
 * for field. Every settings resource carries a read-only `id`/`updated_at`
 * alongside its editable fields; the forms bind only the editable subset.
 */

export type BrandSettings = {
  id: string;
  logo_url: string;
  favicon_url: string;
  color_primary: string;
  color_secondary: string;
  tone_of_voice: string;
  company_description: string;
  /**
   * White-label name shown in place of `organization.name`. Kept separate
   * from it on the backend so rebranding never touches the slug or anything
   * derived from the original name, which is why this is a branding field
   * rather than an edit to the General tab.
   */
  display_name: string;
  email_from_name: string;
  email_reply_to: string;
  updated_at: string;
};

/** Contact and business details. Every field is blank-able, never null. */
export type OrganizationProfile = {
  id: string;
  legal_name: string;
  website: string;
  contact_email: string;
  contact_phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  updated_at: string;
};

/**
 * `Organization.settings["features"]` — mirrors `FEATURE_FLAG_KEYS` in
 * `apps/organizations/constants.py`. The backend rejects any key outside its
 * allowlist, so this union is the contract, not a convenience.
 */
export type FeatureFlagKey = 'agents_beta' | 'advanced_analytics' | 'level_2_outreach';

/**
 * `GET` always returns every allowlisted key, defaulted to `false`, so the
 * response shape never depends on which flags an org happens to have touched
 * before. `PATCH` merges, so a partial body is legal there.
 */
export type FeatureFlags = Record<FeatureFlagKey, boolean>;

/**
 * A custom domain claimed by the organization.
 *
 * Data-model groundwork on the backend: nothing routes on these yet, and
 * `verify` flips the flag without performing a DNS lookup. The UI says so
 * rather than implying a working custom-domain feature.
 */
export type OrganizationDomain = {
  id: string;
  domain: string;
  /** DNS TXT value the org must publish. Generated once, never rotated. */
  verification_token: string;
  is_verified: boolean;
  verified_at: string | null;
  is_primary: boolean;
  created_at: string;
};

export type AiPreferences = {
  id: string;
  require_approval_before_outreach: boolean;
  require_approval_before_publishing: boolean;
  allow_auto_crm_updates: boolean;
  updated_at: string;
};

export type SecuritySettings = {
  id: string;
  require_2fa: boolean;
  log_all_agent_actions: boolean;
  updated_at: string;
};

/** Mirrors `OrgDataExportStatus` in `apps/organizations/models.py`. */
export type OrgDataExportStatus = 'pending' | 'processing' | 'ready' | 'failed';

export type OrgDataExport = {
  id: string;
  status: OrgDataExportStatus;
  /** `null` until the job finishes. */
  file_size: number | null;
  /** Blank (`''`), never null — the model defaults it to an empty string. */
  error_message: string;
  completed_at: string | null;
  /** Blank when the requesting user has since been deleted (`SET_NULL` FK). */
  requested_by_email: string;
  created_at: string;
};
