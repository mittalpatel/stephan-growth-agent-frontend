'use client';

import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { SETTINGS_BRAND_SUMMARY_ENDPOINT, SETTINGS_BRAND_SUMMARY_KEY } from '@/services/settings';
import type { ApiResponse } from '@/types/api';
import type { BrandSummary } from '@/types/settings';
import { t } from '@/locales';

const BRANDING_STALE_TIME_MS = 5 * 60 * 1000;

/**
 * The organization's white-label identity for the app shell.
 *
 * Reads `GET /settings/brand/summary/`, open to any authenticated member (the full
 * brand endpoint needs `organization:view`). The Brand tab invalidates this key on
 * save. A failed read falls back to the platform name and mark rather than showing
 * an error for cosmetics.
 */
export function useOrgBranding() {
  const { organization } = useOrganization();

  const query = useAuthQuery<ApiResponse<BrandSummary>>(
    [SETTINGS_BRAND_SUMMARY_KEY],
    SETTINGS_BRAND_SUMMARY_ENDPOINT,
    {
      enabled: Boolean(organization?.id),
      staleTime: BRANDING_STALE_TIME_MS,
    }
  );

  const brand = query.data?.data;

  return {
    // Distinguishes "still loading" from "loaded, and this organization has no
    // favicon". Only the second should reset the tab icon to the platform's.
    isBrandLoaded: query.isSuccess,
    displayName: brand?.display_name.trim() || t.common.appName,
    logoUrl: brand?.logo_url.trim() || null,
    faviconUrl: brand?.favicon_url.trim() || null,
    colorPrimary: brand?.color_primary ?? '',
    onColorPrimary: brand?.on_color_primary ?? '',
  };
}
