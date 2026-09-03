/**
 * Project DTOs — the demo module's half of the API contract.
 *
 * These mirror `apps/projects/api/v1/serializers/projects.py` field for field.
 * Names match the backend exactly (`snake_case`, not camelCase) and are not
 * remapped on the way in: a rename layer means every error the backend keys by
 * field name (`{"name": "..."}`) has to be translated back before
 * `applyApiError` can bind it inline, and that map is one more thing to keep in
 * sync. Ugly casing beats a translation table.
 *
 * Removed wholesale by `npm run strip-demo`.
 */

/** Mirrors `ProjectStatus` in `apps/projects/constants.py`. */
export type ProjectStatus = 'draft' | 'active' | 'archived';

/** Mirrors `ProjectCategory` in `apps/projects/constants.py`. */
export type ProjectCategory = 'standard' | 'premium' | 'legacy';

/** Row shape from `GET /api/v1/projects/` — narrower than the detail on purpose. */
export type ProjectListItem = {
  id: string;
  name: string;
  status: ProjectStatus;
  category: ProjectCategory;
  owner_email: string;
  created_at: string;
  updated_at: string;
};

/** Full shape from the detail endpoint and every write response. */
export type Project = ProjectListItem & {
  description: string;
  /** Backend-computed: false once archived. Drives the UI's disabled state. */
  is_editable: boolean;
  deleted_at: string | null;
};

/**
 * Create/update input — mirrors `ProjectWriteSerializer`.
 *
 * The Zod schema in `src/lib/schemas/project.ts` must use these exact key names.
 * That is the whole reason field-keyed errors bind inline without a lookup table.
 */
export type ProjectWriteInput = {
  name: string;
  description: string;
  status: ProjectStatus;
  category: ProjectCategory;
};

/** Access levels grantable on a project — mirrors `ProjectAccessLevel`. */
export type ProjectAccessLevel = 'viewer' | 'editor' | 'manager';

/** Row shape from `GET /api/v1/projects/<id>/access/`. */
export type ProjectAccessGrant = {
  user_id: string;
  user_name: string;
  user_email: string;
  access_level: ProjectAccessLevel;
  granted_by: string;
  granted_at: string;
};

/** Body for `POST /api/v1/projects/<id>/access/`. */
export type ProjectAccessGrantInput = {
  user_id: string;
  access_level: ProjectAccessLevel;
};
