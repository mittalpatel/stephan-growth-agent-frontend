import { z } from 'zod';

import { t } from '@/locales';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

/** Field names match `BrandSettingsSerializer` exactly. */
export const brandSettingsSchema = z.object({
  logo_url: z.string().trim().optional().or(z.literal('')),
  color_primary: z
    .string()
    .trim()
    .regex(HEX_COLOR, t.organizations.settingsTabs.brand.colorInvalid)
    .optional()
    .or(z.literal('')),
  tone_of_voice: z.string().trim().optional().or(z.literal('')),
  company_description: z.string().trim().optional().or(z.literal('')),
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
