'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import { checkBrandAsset, type BrandAssetKind } from '@/lib/constants/brandAssets';
import {
  SETTINGS_BRAND_ENDPOINT,
  SETTINGS_BRAND_FAVICON_ENDPOINT,
  SETTINGS_BRAND_KEY,
  SETTINGS_BRAND_LOGO_ENDPOINT,
  SETTINGS_BRAND_SUMMARY_KEY,
} from '@/services/settings';
import type { ApiResponse } from '@/types/api';
import type { BrandSettings } from '@/types/settings';
import { t } from '@/locales';

const UPLOAD_ENDPOINT: Record<BrandAssetKind, string> = {
  logo: SETTINGS_BRAND_LOGO_ENDPOINT,
  favicon: SETTINGS_BRAND_FAVICON_ENDPOINT,
};

/** The `BrandSettings` column each kind is stored in. */
const URL_FIELD = { logo: 'logo_url', favicon: 'favicon_url' } as const;

/**
 * Upload, replace or remove the organization's logo or favicon.
 *
 * The backend stores the file and saves a backend-hosted URL (so it loads under the
 * CSP); clearing goes through the ordinary brand PATCH. Both write the brand row, so
 * the Brand tab's cache is replaced from the response and the shell's member-readable
 * summary is invalidated. Neither touches the tab's text fields, so unsaved edits
 * there survive (the tab's reset keeps dirty values).
 */
export function useBrandImage(kind: BrandAssetKind) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useAuthMutation<
    ApiResponse<BrandSettings>,
    FormData | Partial<Record<'logo_url' | 'favicon_url', string>>
  >();

  const onSaved = (response: ApiResponse<BrandSettings>, message: string) => {
    queryClient.setQueryData([SETTINGS_BRAND_KEY], response);
    void queryClient.invalidateQueries({ queryKey: [SETTINGS_BRAND_SUMMARY_KEY] });
    toast.success(message);
  };

  const upload = async (file: File) => {
    const problem = checkBrandAsset(kind, file);
    if (problem) {
      toast.error(
        problem === 'type'
          ? t.organizations.settingsTabs.brand.imageTypeError
          : t.organizations.settingsTabs.brand.imageSizeError
      );
      return;
    }
    const body = new FormData();
    body.append('file', file);
    try {
      const response = await mutateAsync({ url: UPLOAD_ENDPOINT[kind], body });
      onSaved(response, t.organizations.settingsTabs.brand.imageUploaded);
    } catch (error) {
      applyApiError(error);
    }
  };

  const remove = async () => {
    try {
      const response = await mutateAsync({
        url: SETTINGS_BRAND_ENDPOINT,
        method: 'patch',
        body: { [URL_FIELD[kind]]: '' },
      });
      onSaved(response, t.organizations.settingsTabs.brand.imageRemoved);
    } catch (error) {
      applyApiError(error);
    }
  };

  return { upload, remove, isBusy: isPending };
}
