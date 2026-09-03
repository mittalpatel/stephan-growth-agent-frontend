'use client';

import { format } from '@/lib/i18n';
import { t } from '@/locales';

/**
 * The chrome around every public auth page — login, forgot-password, signup,
 * both MFA steps.
 *
 * A split-screen layout on medium+ screens: a left branding panel (name +
 * tagline on the theme's `primary` surface, no artwork — a template that
 * ships placeholder artwork gets placeholder artwork in production) and a
 * right panel with the actual card, which is all `children` ever renders
 * into. Below `md` the left panel is hidden and this collapses back to the
 * single centred card the original template used.
 *
 * There is deliberately no mount-fade. An auth page is the first thing a user
 * sees, and animating it in puts an animation frame between them and the only
 * control they came for.
 */
export default function AuthHeroShell({
  title,
  subtitle,
  children,
}: Readonly<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();

  return (
    <main className="bg-muted/40 flex min-h-screen">
      <div className="bg-brand-surface text-brand-surface-foreground relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 md:flex">
        <span className="font-display relative text-lg font-bold tracking-tight">
          {t.common.appName}
        </span>
        <div className="relative space-y-2">
          <p className="font-display max-w-sm text-4xl leading-tight font-bold tracking-tight text-balance">
            {t.auth.heroTagline}
          </p>
        </div>
        <p className="text-brand-surface-foreground/70 relative text-xs">
          {format(t.auth.copyright, { year: String(currentYear) })}
        </p>
      </div>

      {/* `min-w-0` is load-bearing: this is a flex item, and a flex item's
          default `min-width: auto` refuses to shrink below its content's
          min-content width. Without it the panel stayed 480px wide inside a
          375px viewport on `/login/otp` (the 6-box code input is the widest
          thing it has to hold), scrolling every auth page sideways on a small
          phone. */}
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card text-card-foreground border-border rounded-xl border p-6 sm:p-8">
            <div className="mb-6 space-y-1.5">
              <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
            </div>
            {children}
          </div>

          <p className="text-muted-foreground mt-6 text-center text-xs md:hidden">
            {format(t.auth.copyright, { year: String(currentYear) })}
          </p>
        </div>
      </div>
    </main>
  );
}
