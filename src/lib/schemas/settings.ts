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
 * Field names match `OrganizationBrandingSerializer` exactly. Only the fields the UI
 * exposes are here (the PATCH is partial): `logo_url`/`favicon_url` are set by the image
 * upload endpoints (`useBrandImage`), and tone, description, secondary color and email
 * sender name are deliberately not exposed.
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
  color_primary: optionalHexColor,
  display_name: z.string().trim(),
  email_reply_to: z
    .string()
    .trim()
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: t.organizations.settingsTabs.brand.emailInvalid,
    }),
});

/**
 * Field names match `OrganizationProfileSerializer` exactly. Only the two fields the UI
 * exposes are here; the PATCH is partial. `website` is a
 * `URLField` and `contact_email` an `EmailField` on the backend; both are
 * blank-able, so both allow `''` and validate only a non-empty value.
 */
export const organizationProfileSchema = z.object({
  website: z
    .string()
    .trim()
    .refine((value) => value === '' || z.string().url().safeParse(value).success, {
      message: t.organizations.settingsTabs.contact.websiteInvalid,
    }),
  contact_email: z
    .string()
    .trim()
    .refine((value) => value === '' || z.string().email().safeParse(value).success, {
      message: t.organizations.settingsTabs.contact.emailInvalid,
    }),
});

export type OrganizationProfileFormValues = z.infer<typeof organizationProfileSchema>;

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
