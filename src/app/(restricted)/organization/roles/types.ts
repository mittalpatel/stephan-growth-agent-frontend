/**
 * Shapes returned by the RBAC role and permission-catalog endpoints.
 *
 * Colocated with the roles route rather than in `src/types/`, since nothing
 * outside this route reads them — and the permission *codes* themselves are
 * backend-defined and asserted against `contracts/permissions.json`, so there is
 * no local enum here that could drift.
 */

export interface CatalogPermission {
  id: string;
  code: string;
  resource: string;
  action: string;
  label: string;
}

export interface OrganizationRole {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_system: boolean;
  permissions: string[];
}
