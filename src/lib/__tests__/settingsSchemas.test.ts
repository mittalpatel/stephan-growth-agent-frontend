import { describe, it, expect } from 'vitest';

import { brandSettingsSchema } from '../schemas/settings';

const valid = {
  logo_url: 'https://example.com/logo.png',
  color_primary: '#0B1E3D',
  tone_of_voice: 'Friendly',
  company_description: 'We sell things.',
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
