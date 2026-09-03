import { z } from 'zod';

import { t } from '@/locales';

/**
 * Create/update validation for a project.
 *
 * ## Field names are load-bearing
 *
 * Every key here matches `ProjectWriteSerializer` in
 * `apps/projects/api/v1/serializers/projects.py` exactly. `applyApiError` takes a
 * field-keyed error out of the response envelope and calls RHF's
 * `setError(field, ...)` with the backend's own key — so a name that matches
 * lands the message under the right input, and a name that does not falls
 * through to an anonymous toast. Rename on one side only and validation quietly
 * stops being inline.
 *
 * ## Trim in the schema, never on submit
 *
 * `.trim()` is part of the transform, so the trimmed value is what gets
 * validated *and* what gets sent. Trimming in the submit handler instead means
 * `'   '` passes a `min(1)` check and then posts an empty name.
 *
 * Client validation here is a courtesy — the backend enforces all of it again,
 * plus the rules a client cannot know (name uniqueness, archived projects being
 * frozen). Never treat a green form as authorization.
 *
 * No `.default()` on the optional-looking fields: it makes zod's *input* type
 * accept `undefined` while the *output* type does not, and `zodResolver`'s
 * generic is keyed off the input side — that mismatch is what breaks
 * `useForm<ProjectFormValues>`. The form supplies the defaults via
 * `defaultValues` instead, which keeps input and output identical.
 */
export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, t.projects.validation.nameRequired)
    .max(200, t.projects.validation.nameTooLong),
  description: z.string().trim().max(5000, t.projects.validation.descriptionTooLong),
  status: z.enum(['draft', 'active', 'archived']),
  category: z.enum(['standard', 'premium', 'legacy']),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
