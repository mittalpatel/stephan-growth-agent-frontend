'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import { organizationDetailKey, type OrganizationDetail } from '@/services/organizations';
import {
  SETTINGS_BOOTSTRAP_ENDPOINT,
  SETTINGS_BOOTSTRAP_KEY,
  SETTINGS_BRAND_KEY,
  SETTINGS_PROFILE_KEY,
} from '@/services/settings';
import type { ApiMeta, ApiResponse } from '@/types/api';
import type { BrandSettings, OrganizationProfile } from '@/types/settings';

type SettingsBootstrap = {
  organization: OrganizationDetail;
  branding: BrandSettings;
  profile: OrganizationProfile;
};

/** Never read — `ApiResponse.meta` is pagination metadata a single-resource
 * response never carries, but the type requires it. */
const EMPTY_META: ApiMeta = {
  count: 0,
  total_pages: 0,
  current_page: 1,
  page_size: 0,
  next: null,
  previous: null,
};

/**
 * Prefetches the Brand and contact settings in one request
 * (`GET /settings/bootstrap/`, backend 2026-09-06) and seeds each tab's own
 * query cache from it, so opening the Settings page costs one round trip
 * instead of one per tab clicked.
 *
 * Deliberately does not replace the individual tab hooks
 * (`useBrandSettingsForm`, `useOrganizationProfileForm`, etc.) — each still
 * owns its own read/write/invalidate cycle against its own endpoint, keyed
 * identically to what this seeds (`[SETTINGS_BRAND_KEY]` and friends), so a
 * save only invalidates the one tab it touched. This hook only warms the
 * cache; nothing reads its own query result directly.
 */
export function useOrganizationSettingsBootstrap(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  const query = useAuthQuery<ApiResponse<SettingsBootstrap>>(
    [SETTINGS_BOOTSTRAP_KEY],
    SETTINGS_BOOTSTRAP_ENDPOINT
  );

  useEffect(() => {
    const bootstrap = query.data?.data;
    if (!bootstrap) return;

    const seed = <T>(key: string, data: T) => {
      queryClient.setQueryData<ApiResponse<T>>(
        [key],
        (existing) =>
          existing ?? { success: true, message: null, data, meta: EMPTY_META, errors: null }
      );
    };

    seed(SETTINGS_BRAND_KEY, bootstrap.branding);
    seed(SETTINGS_PROFILE_KEY, bootstrap.profile);
    if (organizationId) {
      queryClient.setQueryData<ApiResponse<OrganizationDetail>>(
        organizationDetailKey(organizationId),
        (existing) =>
          existing ?? {
            success: true,
            message: null,
            data: bootstrap.organization,
            meta: EMPTY_META,
            errors: null,
          }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, organizationId]);
}
