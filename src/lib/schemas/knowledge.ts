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
/**
 * How a new website is read. Not a backend field itself: `useAddWebsiteFlow`
 * turns `all` into `auto_extract: true` on the discover call.
 */
export const WEBSITE_READ_MODES = ['all', 'choose'] as const;
export type WebsiteReadMode = (typeof WEBSITE_READ_MODES)[number];

/** Any scheme prefix, so a bare `example.com` can be told apart from `ftp://…`. */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * A website address as people type it. A bare `example.com` used to be
 * refused as invalid while `ftp://example.com` was accepted and then never
 * crawled (client testing, 13 Oct 2026). Bare hosts now get `https://`, and
 * only http(s) passes. Private and local addresses are refused by the
 * backend, which can resolve the host; that error binds to this field.
 */
const websiteUrl = z
  .string()
  .trim()
  .min(1, t.knowledge.validation.rootUrlRequired)
  .transform((value) => (HAS_SCHEME.test(value) ? value : `https://${value}`))
  .pipe(
    z
      .url(t.knowledge.validation.rootUrlInvalid)
      .refine((value) => /^https?:\/\//i.test(value), t.knowledge.validation.rootUrlScheme)
  );

export const websiteDiscoverSchema = z.object({
  read_mode: z.enum(WEBSITE_READ_MODES),
  root_url: websiteUrl,
  max_pages: z
    .union([
      z.literal(''),
      z.coerce
        .number(t.knowledge.validation.maxPagesRange)
        .int(t.knowledge.validation.maxPagesRange)
        .min(1, t.knowledge.validation.maxPagesRange)
        .max(1000, t.knowledge.validation.maxPagesRange),
    ])
    .optional(),
  max_depth: z
    .union([
      z.literal(''),
      z.coerce
        .number(t.knowledge.validation.maxDepthRange)
        .int(t.knowledge.validation.maxDepthRange)
        .min(0, t.knowledge.validation.maxDepthRange)
        .max(10, t.knowledge.validation.maxDepthRange),
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
