import { describe, expect, it } from 'vitest';

import { orgAccentStyle, orgSurfaceStyle } from '@/lib/orgColors';
import { PLATFORM_BRANDING, resolvePublicBranding } from '@/lib/publicBranding';

describe('org color overrides', () => {
  it('re-points the accent token pair for a valid color and its readable text color', () => {
    expect(orgAccentStyle('#FED700', '#111827')).toEqual({
      '--brand-accent': '#FED700',
      '--brand-accent-foreground': '#111827',
    });
  });

  it('re-points the surface token pair', () => {
    expect(orgSurfaceStyle('#0A3D51', '#ffffff')).toEqual({
      '--brand-surface': '#0A3D51',
      '--brand-surface-foreground': '#ffffff',
      // Inverted so accent marks on the panel stay visible against it.
      '--brand-accent': '#ffffff',
      '--brand-accent-foreground': '#0A3D51',
    });
  });

  it('yields no override when either color is blank or not hex', () => {
    expect(orgAccentStyle('', '#ffffff')).toBeUndefined();
    expect(orgAccentStyle('#0A3D51', '')).toBeUndefined();
    expect(orgSurfaceStyle('red; background: url(x)', '#ffffff')).toBeUndefined();
  });
});

describe('resolvePublicBranding', () => {
  it('is the platform identity when no custom domain matched', () => {
    expect(resolvePublicBranding(null)).toBe(PLATFORM_BRANDING);
  });

  it('maps the backend payload and falls back to the platform name when blank', () => {
    const branded = resolvePublicBranding({
      display_name: ' Acme ',
      logo_url: 'http://api/public/brand-assets/1/logo.png',
      favicon_url: '',
      color_primary: '#0A3D51',
      on_color_primary: '#ffffff',
    });
    expect(branded).toEqual({
      displayName: 'Acme',
      logoUrl: 'http://api/public/brand-assets/1/logo.png',
      colorPrimary: '#0A3D51',
      onColorPrimary: '#ffffff',
    });
    expect(
      resolvePublicBranding({
        ...{ display_name: '', logo_url: '', favicon_url: '' },
        color_primary: '',
        on_color_primary: '#ffffff',
      }).displayName
    ).toBe(PLATFORM_BRANDING.displayName);
  });
});
