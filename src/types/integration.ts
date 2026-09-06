/** Mirrors `apps/integrations_catalog/api/v1/serializers/integrations.py`. */

export type IntegrationCategory = 'crm' | 'lead_ads' | 'messaging' | 'email';
export type IntegrationStatus = 'not_connected' | 'connected';

export type IntegrationCatalogItem = {
  id: string;
  code: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  status: IntegrationStatus;
  detail: string;
  connected_at: string | null;
};
