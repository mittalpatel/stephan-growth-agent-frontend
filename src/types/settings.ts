export type BrandSettings = {
  id: string;
  logo_url: string;
  color_primary: string;
  tone_of_voice: string;
  company_description: string;
  updated_at: string;
};

export type AiPreferences = {
  require_approval_before_outreach: boolean;
  require_approval_before_publishing: boolean;
  allow_auto_crm_updates: boolean;
};

export type SecuritySettings = {
  require_2fa: boolean;
  log_all_agent_actions: boolean;
};

export type OrgDataExport = {
  id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  file_size: number | null;
  error_message: string | null;
  completed_at: string | null;
  requested_by_email: string;
  created_at: string;
};
