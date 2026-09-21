'use client';

import { useRef, useState } from 'react';
import { ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BRAND_ASSET_RULES, type BrandAssetKind } from '@/lib/constants/brandAssets';
import { format } from '@/lib/i18n';
import { t } from '@/locales';

import { useBrandImage } from '../hooks/useBrandImage';

type Props = Readonly<{
  kind: BrandAssetKind;
  label: string;
  hint: string;
  /** The saved URL, or an empty string when none is set. */
  url: string;
  canManage: boolean;
}>;

/**
 * One brand image (logo or favicon): a preview, an upload/replace button and a
 * remove button. Not an RHF field on purpose: the image is saved the moment it is
 * uploaded, separately from the form's Save, because the file goes to its own
 * endpoint and the form only carries text.
 */
export function BrandImageField({ kind, label, hint, url, canManage }: Props) {
  const { upload, remove, isBusy } = useBrandImage(kind);
  const inputRef = useRef<HTMLInputElement>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = url !== '' && url !== failedUrl;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-4">
        <div className="bg-muted border-border text-muted-foreground flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {showImage ? (
            // Backend-hosted upload, so it passes the CSP; a tenant URL can't go
            // through next/image's optimizer allowlist.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt=""
              onError={() => setFailedUrl(url)}
              className="size-full object-contain"
            />
          ) : (
            <ImageIcon className="size-6" />
          )}
        </div>
        <div className="space-y-2">
          {canManage && (
            <div className="flex flex-wrap gap-2">
              <input
                ref={inputRef}
                type="file"
                accept={[
                  ...BRAND_ASSET_RULES[kind].mimeTypes,
                  ...(kind === 'favicon' ? ['.ico'] : []),
                ].join(',')}
                aria-label={format(t.organizations.settingsTabs.brand.imageInputLabel, { label })}
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) void upload(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() => inputRef.current?.click()}
              >
                {isBusy
                  ? t.organizations.settingsTabs.brand.imageUploading
                  : url
                    ? t.organizations.settingsTabs.brand.imageReplace
                    : t.organizations.settingsTabs.brand.imageUpload}
              </Button>
              {url && (
                <Button type="button" variant="ghost" size="sm" disabled={isBusy} onClick={remove}>
                  {t.organizations.settingsTabs.brand.imageRemove}
                </Button>
              )}
            </div>
          )}
          <p className="text-muted-foreground text-xs">{hint}</p>
        </div>
      </div>
    </div>
  );
}
