/**
 * Lead DTOs — mirrors `apps/leads/api/v1/serializers/leads.py` field for
 * field. Names match the backend exactly (`snake_case`).
 */

/** Mirrors `LeadStatus` in `apps/leads/constants.py`. */
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'disqualified';

/** Row shape from `GET /api/v1/leads/`. */
export type LeadListItem = {
  id: string;
  agent_id: string;
  conversation_id: string | null;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  consent_given: boolean;
  created_at: string;
};

export type LeadField = {
  field_name: string;
  purpose: string;
  collected_at: string;
};

export type LeadConversationSummary = {
  id: string;
  status: string;
  created_at: string;
};

/** Full record from `GET /api/v1/leads/{id}/`. */
export type Lead = LeadListItem & {
  interest_note: string;
  consent_notice_version: string;
  fields: LeadField[];
  conversation: LeadConversationSummary | null;
};
