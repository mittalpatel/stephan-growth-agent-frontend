import { z } from 'zod';

import { t } from '@/locales';

/** `#` + 6 hex digits, mirroring `_HEX_COLOR_RE` in the backend serializer. */
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

/**
 * Field names match `OrganizationBrandingSerializer` exactly.
 *
 * Every field is optional on the backend and blank-able, so each is a plain
 * (possibly empty) string rather than `.optional()`: the form always renders
 * all four inputs, so it always submits all four, and `''` is how "unset"
 * travels. `validate_color_primary` skips the regex for a blank value, so the
 * empty case is explicitly allowed here too rather than being rejected
 * client-side for a value the server accepts.
 */
export const brandSettingsSchema = z.object({
  logo_url: z.string().trim(),
  color_primary: z
    .string()
    .trim()
    .refine((value) => value === '' || HEX_COLOR.test(value), {
      message: t.organizations.settingsTabs.brand.colorInvalid,
    }),
  tone_of_voice: z.string().trim(),
  company_description: z.string().trim(),
});

export type BrandSettingsFormValues = z.infer<typeof brandSettingsSchema>;

/** Field names match `AiPreferencesSerializer` exactly. */
export const aiPreferencesSchema = z.object({
  require_approval_before_outreach: z.boolean(),
  require_approval_before_publishing: z.boolean(),
  allow_auto_crm_updates: z.boolean(),
});

export type AiPreferencesFormValues = z.infer<typeof aiPreferencesSchema>;

/** Field names match `SecuritySettingsSerializer` exactly. */
export const securitySettingsSchema = z.object({
  require_2fa: z.boolean(),
  log_all_agent_actions: z.boolean(),
});

export type SecuritySettingsFormValues = z.infer<typeof securitySettingsSchema>;
