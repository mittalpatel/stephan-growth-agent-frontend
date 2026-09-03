/**
 * File DTOs — files are a per-project attachment, nested under one project.
 * These mirror `apps/projects/api/v1/serializers/files.py` field for field.
 *
 * Names match the backend exactly (`snake_case`, not camelCase) and are not
 * remapped on the way in: a rename layer means every error the backend keys by
 * field name (`{"name": "..."}`) has to be translated back before
 * `applyApiError` can bind it inline, and that map is one more thing to keep in
 * sync. Ugly casing beats a translation table.
 */
export type ProjectFile = {
  id: string;
  name: string;
  original_filename: string;
  /** Bytes. */
  size: number;
  /** MIME type, e.g. `image/png`. */
  content_type: string;
  owner_email: string;
  created_at: string;
  updated_at: string;
};

/** Rename input — mirrors the write serializer's only mutable field. */
export type ProjectFileWriteInput = {
  name: string;
};
