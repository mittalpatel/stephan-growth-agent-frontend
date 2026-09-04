import { z } from 'zod';

import { t } from '@/locales';

/** Mirrors `WebsiteDiscoverSerializer`'s only required field. */
export const websiteDiscoverSchema = z.object({
  root_url: z
    .string()
    .trim()
    .min(1, t.knowledge.validation.rootUrlRequired)
    .url(t.knowledge.validation.rootUrlInvalid),
});

export type WebsiteDiscoverFormValues = z.infer<typeof websiteDiscoverSchema>;

/** Mirrors `KnowledgeSourceWriteSerializer`. */
export const knowledgeSourceRenameSchema = z.object({
  display_name: z.string().trim().min(1, t.knowledge.validation.nameRequired).max(200),
});

export type KnowledgeSourceRenameFormValues = z.infer<typeof knowledgeSourceRenameSchema>;
