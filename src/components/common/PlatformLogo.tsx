import { cn } from '@/lib/utils';
import { t } from '@/locales';

/** Served from `public/brand/`, converted from the client's Illustrator EPS files. */
const LOGO_ON_LIGHT = '/brand/yb-inspire-logo.svg';
const LOGO_ON_DARK = '/brand/yb-inspire-logo-on-dark.svg';

type Props = Readonly<{
  /**
   * `auto` follows the theme. `dark` always uses the white-"YB" artwork, for a
   * panel that stays dark in both themes (`bg-brand-surface`).
   */
  surface?: 'auto' | 'dark';
  /** Sets the height; the width follows the artwork's 2.5:1 ratio. */
  className?: string;
}>;

/**
 * The YB Inspire wordmark, shown wherever the platform's own brand appears
 * (an organization with its own logo keeps `BrandMark`). Replaces the generic
 * glyph tile and typed name used until the client supplied the artwork
 * (13 Oct 2026). The navy "YB" of the light version disappears on a dark
 * surface, so the dark version swaps it for white.
 */
export function PlatformLogo({ surface = 'auto', className = 'h-8' }: Props) {
  if (surface === 'dark') {
    // eslint-disable-next-line @next/next/no-img-element -- static SVG, nothing to optimize
    return <img src={LOGO_ON_DARK} alt={t.common.appName} className={cn('w-auto', className)} />;
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, nothing to optimize */}
      <img
        src={LOGO_ON_LIGHT}
        alt={t.common.appName}
        className={cn('w-auto dark:hidden', className)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, nothing to optimize */}
      <img
        src={LOGO_ON_DARK}
        alt={t.common.appName}
        className={cn('hidden w-auto dark:block', className)}
      />
    </>
  );
}
