import { z } from 'zod';

import { isValidHostname } from '@/lib/hostname';
import { t } from '@/locales';

/** `#` + 6 hex digits, mirroring `_HEX_COLOR_RE` in the backend serializer. */
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

/** Blank is a real value on every one of these fields, so it is allowed. */
const optionalHexColor = z
  .string()
  .trim()
  .refine((value) => value === '' || HEX_COLOR.test(value), {
    message: t.organizations.settingsTabs.brand.colorInvalid,
  });

/**
 * Field names match `OrganizationBrandingSerializer` exactly.
 *
 * Every field is optional on the backend and blank-able, so each is a plain
 * (possibly empty) string rather than `.optional()`: the form always renders
 * every input, so it always submits every one, and `''` is how "unset"
 * travels. `_validate_hex` skips the regex for a blank value, so the empty
 * case is explicitly allowed here too rather than being rejected client-side
 * for a value the server accepts.
 *
 * `email_reply_to` is the one exception worth validating locally: it is an
 * `EmailField` on the backend, so a malformed address is a guaranteed 400 and
 * catching it here saves the round trip. Blank still passes.
 */
export const brandSettingsSchema = z.object({
  logo_url: z.string().trim(),
  favicon_url: z.string().trim(),
  color_primary: optionalHexColor,
  color_secondary: optionalHexColor,
  tone_of_voice: z.string().trim(),
  company_description: z.string().trim(),
  display_name: z.string().trim(),
  email_from_name: z.string().trim(),
  email_reply_to: z
    .string()
    .trim()
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: t.organizations.settingsTabs.brand.emailInvalid,
    }),
});

/**
 * Field names match `OrganizationProfileSerializer` exactly. `website` is a
 * `URLField` and `contact_email` an `EmailField` on the backend; both are
 * blank-able, so both allow `''` and validate only a non-empty value.
 */
export const organizationProfileSchema = z.object({
  legal_name: z.string().trim(),
  website: z
    .string()
    .trim()
    .refine((value) => value === '' || z.string().url().safeParse(value).success, {
      message: t.organizations.settingsTabs.profile.websiteInvalid,
    }),
  contact_email: z
    .string()
    .trim()
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: t.organizations.settingsTabs.profile.emailInvalid,
    }),
  contact_phone: z.string().trim(),
  address_line1: z.string().trim(),
  address_line2: z.string().trim(),
  city: z.string().trim(),
  state: z.string().trim(),
  postal_code: z.string().trim(),
  country: z.string().trim(),
});

export type OrganizationProfileFormValues = z.infer<typeof organizationProfileSchema>;

/**
 * Field names match `FEATURE_FLAG_KEYS` in
 * `apps/organizations/constants.py`. The backend 400s on any key outside its
 * allowlist, so adding a flag means editing both sides.
 */
export const featureFlagsSchema = z.object({
  agents_beta: z.boolean(),
  advanced_analytics: z.boolean(),
  level_2_outreach: z.boolean(),
});

export type FeatureFlagsFormValues = z.infer<typeof featureFlagsSchema>;

/**
 * `is_valid_hostname()` now backs both the agent allowed-domains and org
 * custom-domains serializers (extracted 2026-09-07, requiring an
 * alphabetic-only TLD) — see `src/lib/hostname.ts`. `localhost` is never
 * accepted here: that one-off is specific to agent widget testing.
 */
export const organizationDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => isValidHostname(value), {
      message: t.organizations.settingsTabs.domains.invalid,
    }),
});

export type OrganizationDomainFormValues = z.infer<typeof organizationDomainSchema>;

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
