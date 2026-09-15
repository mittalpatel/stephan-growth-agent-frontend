import { z } from 'zod';

import { t } from '@/locales';

/**
 * Mirrors `WebsiteDiscoverSerializer`. `root_url` is its only required field;
 * the rest are the flat, form-facing equivalents of `scope_config`'s keys
 * (`apps/knowledge/services/crawl_scope.py`), assembled back into that nested
 * object at submit time by `useAddWebsiteFlow`'s `buildScopeConfig`.
 *
 * `max_pages`/`max_depth` accept `''` alongside a coerced number: a native
 * number input reports an untouched field as `''`, and `z.coerce.number()`
 * alone would turn that into `0` — silently submitting `max_depth: 0` for a
 * field nobody touched. The union keeps "blank" distinct from an explicit
 * `0`, which `crawl_scope.py` treats as a real, meaningful value (crawl only
 * the seed page, follow no links) rather than something to fall back away
 * from.
 */
export const websiteDiscoverSchema = z.object({
  root_url: z
    .string()
    .trim()
    .min(1, t.knowledge.validation.rootUrlRequired)
    .url(t.knowledge.validation.rootUrlInvalid),
  max_pages: z
    .union([
      z.literal(''),
      z.coerce.number().int().positive().max(1000, t.knowledge.validation.maxPagesRange),
    ])
    .optional(),
  max_depth: z
    .union([
      z.literal(''),
      z.coerce.number().int().min(0).max(10, t.knowledge.validation.maxDepthRange),
    ])
    .optional(),
  include_paths: z
    .array(z.object({ value: z.string().trim().max(200) }))
    .max(20, t.knowledge.validation.pathListTooLong),
  exclude_paths: z
    .array(z.object({ value: z.string().trim().max(200) }))
    .max(20, t.knowledge.validation.pathListTooLong),
});

// `z.coerce.number()` gives `max_pages`/`max_depth` an `unknown` input type
// (RHF's registered value before Zod runs) but a `number | ''` output type
// (after `zodResolver` parses it) — the same input/output divergence
// `agentDraftUpdateSchema` has for its `.transform()` fields. `FormValues` is
// what the form/RHF primitives are typed against; `SubmitValues` is what
// `handleSubmit`'s callback actually receives.
export type WebsiteDiscoverFormValues = z.input<typeof websiteDiscoverSchema>;
export type WebsiteDiscoverSubmitValues = z.output<typeof websiteDiscoverSchema>;

/** One entry of `DiscoveredUrlBulkActionSerializer.add`. */
export const discoveredUrlAddSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, t.knowledge.validation.rootUrlRequired)
    .url(t.knowledge.validation.rootUrlInvalid),
});

export type DiscoveredUrlAddFormValues = z.infer<typeof discoveredUrlAddSchema>;

/** Mirrors `KnowledgeSourceWriteSerializer`. */
export const knowledgeSourceRenameSchema = z.object({
  display_name: z.string().trim().min(1, t.knowledge.validation.nameRequired).max(200),
});

export type KnowledgeSourceRenameFormValues = z.infer<typeof knowledgeSourceRenameSchema>;
