/** Mirrors `apps/integrations_catalog/api/v1/serializers/integrations.py`. */

export type IntegrationCategory = 'crm' | 'lead_ads' | 'messaging' | 'email';
export type IntegrationStatus = 'not_connected' | 'connected';

/** Row shape from `GET /api/v1/integrations/` (`IntegrationWithStatusSerializer`). */
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

/**
 * `POST .../{id}/{connect,disconnect}/`'s response
 * (`OrgIntegrationStatusSerializer`) — deliberately a different shape from the
 * list row: the catalog entry is nested rather than flattened, and
 * `credential_reference` is never echoed back.
 */
export type OrgIntegrationStatusResponse = {
  integration: Pick<IntegrationCatalogItem, 'id' | 'code' | 'name' | 'category' | 'description'>;
  status: IntegrationStatus;
  detail: string;
  connected_at: string | null;
};
