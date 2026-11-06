import { cn } from '@/lib/utils';
import { t } from '@/locales';

/** Served from `public/brand/`, trimmed from the growth-agents.com wordmark. */
const LOGO_ON_LIGHT = '/brand/growth-agents-logo.png';
const LOGO_ON_DARK = '/brand/growth-agents-logo-on-dark.png';

type Props = Readonly<{
  /**
   * `auto` follows the theme. `dark` always uses the white-"GROWTH" artwork, for a
   * panel that stays dark in both themes (`bg-brand-surface`).
   */
  surface?: 'auto' | 'dark';
  /** Sets the height; the width follows the artwork's 5.7:1 ratio. */
  className?: string;
}>;

/**
 * The Growth Agents wordmark, shown wherever the platform's own brand appears
 * (an organization with its own logo keeps `BrandMark`). The black "GROWTH" of
 * the light version disappears on a dark surface, so the dark version swaps it
 * for white and lifts the brand blue to #6B6BFF (4.6:1 on `--brand-surface`;
 * #1B1AFF measures 2.3:1 there).
 */
export function PlatformLogo({ surface = 'auto', className = 'h-8' }: Props) {
  if (surface === 'dark') {
    // eslint-disable-next-line @next/next/no-img-element -- static brand PNG, nothing to optimize
    return <img src={LOGO_ON_DARK} alt={t.common.appName} className={cn('w-auto', className)} />;
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand PNG, nothing to optimize */}
      <img
        src={LOGO_ON_LIGHT}
        alt={t.common.appName}
        className={cn('w-auto dark:hidden', className)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand PNG, nothing to optimize */}
      <img
        src={LOGO_ON_DARK}
        alt={t.common.appName}
        className={cn('hidden w-auto dark:block', className)}
      />
    </>
  );
}
