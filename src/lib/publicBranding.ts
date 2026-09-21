import type { PublicBranding } from '@/types/settings';
import { t } from '@/locales';

/** What the signed-out pages render: the platform's own identity unless a verified
 * custom domain supplied its organization's. */
export type PublicBrandingValue = {
  displayName: string;
  logoUrl: string | null;
  colorPrimary: string;
  onColorPrimary: string;
};

export const PLATFORM_BRANDING: PublicBrandingValue = {
  displayName: t.common.appName,
  logoUrl: null,
  colorPrimary: '',
  onColorPrimary: '',
};

export function resolvePublicBranding(branding: PublicBranding | null): PublicBrandingValue {
  if (!branding) return PLATFORM_BRANDING;
  return {
    displayName: branding.display_name.trim() || t.common.appName,
    logoUrl: branding.logo_url.trim() || null,
    colorPrimary: branding.color_primary,
    onColorPrimary: branding.on_color_primary,
  };
}
