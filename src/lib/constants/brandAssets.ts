/**
 * Mirror of the backend's brand-image upload rules (`BRAND_ASSET_*` in
 * `apps/organizations/constants.py`). Client-side checks are a courtesy that saves
 * a round trip; the backend re-checks the type from the file's actual bytes and
 * rejects SVG, so a green check here is not authorization.
 */
export type BrandAssetKind = 'logo' | 'favicon';

/**
 * The platform's own tab icon, served from `public/`. Referenced by the root layout's
 * `icons` metadata and by `LayoutWrapper`, which restores it the moment an organization
 * clears its own favicon. Both must name the same file, so it is declared once here.
 */
export const PLATFORM_FAVICON_HREF = '/favicon.ico';

export const BRAND_ASSET_RULES: Record<
  BrandAssetKind,
  { mimeTypes: readonly string[]; maxBytes: number }
> = {
  logo: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    maxBytes: 2 * 1024 * 1024,
  },
  favicon: {
    mimeTypes: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'],
    maxBytes: 512 * 1024,
  },
};

/** Browsers report `.ico` as either MIME type or as empty, so accept by extension too. */
const ICO_EXTENSION = /\.ico$/i;

export type BrandAssetProblem = 'type' | 'size';

/** The first reason `file` would be rejected for `kind`, or `null` if it looks fine. */
export function checkBrandAsset(kind: BrandAssetKind, file: File): BrandAssetProblem | null {
  const rules = BRAND_ASSET_RULES[kind];
  const typeOk =
    rules.mimeTypes.includes(file.type) || (kind === 'favicon' && ICO_EXTENSION.test(file.name));
  if (!typeOk) return 'type';
  if (file.size > rules.maxBytes) return 'size';
  return null;
}
