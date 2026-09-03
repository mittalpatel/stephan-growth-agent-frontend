import { z } from 'zod';

import { t } from '@/locales';

/**
 * Upload-dialog validation for a project's attached file — just the display
 * name; the file itself is tracked outside RHF (a `File` object, not a form
 * value) and validated separately before submit.
 *
 * Client validation here is a courtesy. The backend enforces this again plus
 * the rules a client cannot know (uniqueness, storage limits).
 */
export const projectFileUploadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, t.projects.files.validation.nameRequired)
    .max(200, t.projects.files.validation.nameTooLong),
});

export type ProjectFileUploadFormValues = z.infer<typeof projectFileUploadSchema>;
