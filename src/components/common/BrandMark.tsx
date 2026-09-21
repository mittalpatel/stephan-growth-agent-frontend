'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { orgAccentStyle } from '@/lib/orgColors';

type Props = Readonly<{
  /** The organization's logo, or `null` to show the platform glyph. */
  logoUrl: string | null;
  /** The organization's primary color and its readable text color; blank for none. */
  colorPrimary?: string;
  onColorPrimary?: string;
  /** Tile size, e.g. `size-8`. */
  className?: string;
  iconClassName?: string;
}>;

/**
 * The brand mark in the app shell and on the public pages: the organization's logo
 * when one is set and loads, otherwise a tile carrying the platform glyph in the
 * organization's color (or the platform's, when it has none). A logo that fails to
 * load falls back to the tile rather than a broken-image icon.
 */
export function BrandMark({
  logoUrl,
  colorPrimary = '',
  onColorPrimary = '',
  className = 'size-8',
  iconClassName = 'size-4',
}: Props) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (logoUrl && logoUrl !== failedUrl) {
    return (
      // Backend-hosted upload, so it passes the CSP; a tenant URL can't go through
      // next/image's optimizer allowlist.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        onError={() => setFailedUrl(logoUrl)}
        className={cn('shrink-0 rounded-lg object-contain', className)}
      />
    );
  }
  return (
    <span
      style={orgAccentStyle(colorPrimary, onColorPrimary)}
      className={cn(
        'bg-brand-accent text-brand-accent-foreground flex shrink-0 items-center justify-center rounded-lg',
        className
      )}
    >
      <Sparkles className={iconClassName} />
    </span>
  );
}
