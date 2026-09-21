/**
 * Organization settings DTOs — the subset of
 * `apps/organizations/api/v1/serializers/{settings,settings_data}.py` the UI reads.
 * The backend returns more (tone, description, secondary color, address, and
 * the feature/AI/security settings being retired), which is ignored here.
 */

export type BrandSettings = {
  id: string;
  logo_url: string;
  favicon_url: string;
  color_primary: string;
  /**
   * White-label name shown in place of `organization.name`. Kept separate
   * from it on the backend so rebranding never touches the slug or anything
   * derived from the original name, which is why this is a branding field
   * rather than an edit to the General tab.
   */
  display_name: string;
  email_reply_to: string;
  updated_at: string;
};

/** The slice of branding every member may read (`GET /settings/brand/summary/`). */
export type BrandSummary = Pick<
  BrandSettings,
  'display_name' | 'logo_url' | 'favicon_url' | 'color_primary'
> & {
  /** Readable text color (near-black or white) for text drawn on `color_primary`,
   * computed by the backend so the UI never guesses one. */
  on_color_primary: string;
};

/** Branding for a verified custom domain (`GET /public/branding/?host=`). */
export type PublicBranding = Pick<
  BrandSummary,
  'display_name' | 'logo_url' | 'favicon_url' | 'color_primary' | 'on_color_primary'
>;

/** The organization's public contact details. Every field is blank-able, never null. */
export type OrganizationProfile = {
  id: string;
  website: string;
  contact_email: string;
  updated_at: string;
};

/** Lifecycle of a custom domain, as `activation_status` reports it. */
export type DomainActivationStatus = 'pending_verification' | 'awaiting_routing' | 'active';

/** The DNS record an organization publishes to prove it controls a domain. */
export type DomainDnsRecord = { type: string; name: string; value: string };

/**
 * A custom domain claimed by the organization.
 *
 * `verify` performs a real DNS TXT lookup and fails until the record in
 * `dns_record` is published. A verified domain is `awaiting_routing` until ops
 * enable proxy/TLS serving for it (`CUSTOM_DOMAIN_ROUTING_ENABLED`), and only then
 * `active`. `is_verified` alone must not be read as "working".
 */
export type OrganizationDomain = {
  id: string;
  domain: string;
  /** Raw token; the record to publish is `dns_record`. */
  verification_token: string;
  dns_record: DomainDnsRecord;
  is_verified: boolean;
  verified_at: string | null;
  is_primary: boolean;
  is_active: boolean;
  activation_status: DomainActivationStatus;
  created_at: string;
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
