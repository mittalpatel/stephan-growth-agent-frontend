/**
 * Organization settings DTOs — mirrors
 * `apps/organizations/api/v1/serializers/{settings,settings_data}.py` field
 * for field. Every settings resource carries a read-only `id`/`updated_at`
 * alongside its editable fields; the forms bind only the editable subset.
 */

export type BrandSettings = {
  id: string;
  logo_url: string;
  color_primary: string;
  tone_of_voice: string;
  company_description: string;
  updated_at: string;
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
