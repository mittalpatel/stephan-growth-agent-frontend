import { describe, it, expect } from 'vitest';

import { brandSettingsSchema, organizationDomainSchema } from '../schemas/settings';

const valid = {
  logo_url: 'https://example.com/logo.png',
  favicon_url: 'https://example.com/favicon.ico',
  color_primary: '#0B1E3D',
  color_secondary: '#C9A227',
  tone_of_voice: 'Friendly',
  company_description: 'We sell things.',
  display_name: 'Example',
  email_from_name: 'Example Support',
  email_reply_to: 'replies@example.com',
};

describe('brandSettingsSchema.color_primary', () => {
  // Mirrors `_HEX_COLOR_RE` + `validate_color_primary` in
  // `apps/organizations/api/v1/serializers/settings.py`. The blank case is the
  // one that matters most: the backend explicitly skips the regex for it, so
  // rejecting it here would block a save the server would have accepted.
  it('accepts a blank value, matching the backend`s own skip', () => {
    expect(brandSettingsSchema.safeParse({ ...valid, color_primary: '' }).success).toBe(true);
  });

  it('accepts six-digit hex in either case', () => {
    for (const color of ['#0B1E3D', '#0b1e3d', '#FFFFFF', '#000000']) {
      expect(brandSettingsSchema.safeParse({ ...valid, color_primary: color }).success).toBe(true);
    }
  });

  it('rejects the shapes the backend regex also rejects', () => {
    for (const color of ['0B1E3D', '#0B1E3', '#0B1E3DD', '#GGGGGG', 'rebeccapurple', '#fff']) {
      expect(brandSettingsSchema.safeParse({ ...valid, color_primary: color }).success).toBe(false);
    }
  });

  it('trims before validating, so a padded hex still passes', () => {
    const parsed = brandSettingsSchema.safeParse({ ...valid, color_primary: '  #0B1E3D  ' });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.color_primary).toBe('#0B1E3D');
  });

  it('trims whitespace-only input down to the accepted blank case', () => {
    const parsed = brandSettingsSchema.safeParse({ ...valid, color_primary: '   ' });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.color_primary).toBe('');
  });
});

describe('brandSettingsSchema.email_reply_to', () => {
  it('accepts a blank value, since the backend field is blank-able', () => {
    expect(brandSettingsSchema.safeParse({ ...valid, email_reply_to: '' }).success).toBe(true);
  });

  it('rejects a malformed address, which the EmailField would 400 on', () => {
    expect(
      brandSettingsSchema.safeParse({ ...valid, email_reply_to: 'not-an-email' }).success
    ).toBe(false);
  });
});

describe('organizationDomainSchema', () => {
  // Mirrors `_DOMAIN_RE` in the backend serializer. Checked label by label
  // here rather than with that regex; these cases pin the two to the same
  // accepted set.
  it('accepts a plain hostname with at least one dot', () => {
    for (const domain of ['example.com', 'app.example.com', 'a-b.example.co.uk', 'x1.io']) {
      expect(organizationDomainSchema.safeParse({ domain }).success).toBe(true);
    }
  });

  it('lowercases before validating, matching the backend', () => {
    const parsed = organizationDomainSchema.safeParse({ domain: '  APP.Example.COM ' });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.domain).toBe('app.example.com');
  });

  it('rejects a scheme, a path, a bare label, or a stray hyphen', () => {
    for (const domain of [
      'https://example.com',
      'example.com/path',
      'localhost',
      '-example.com',
      'example-.com',
      'example..com',
      'exa mple.com',
    ]) {
      expect(organizationDomainSchema.safeParse({ domain }).success).toBe(false);
    }
  });
});
