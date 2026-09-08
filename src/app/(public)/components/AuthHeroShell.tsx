'use client';

import { CheckCircle2, Sparkles } from 'lucide-react';

import { format } from '@/lib/i18n';
import { t } from '@/locales';

/**
 * The chrome around every public auth page — login, forgot-password, signup,
 * both MFA steps.
 *
 * A split-screen layout on medium+ screens: a left branding panel (logo mark,
 * tagline, and a short feature list on the theme's `brand-surface`, a token
 * kept deliberately identical in both light and dark rather than derived from
 * `primary`, since a full-bleed brand panel shouldn't lighten the way a
 * button fill does) and a right panel with the actual card, which is all
 * `children` ever renders into. Below `md` the left panel is hidden and a
 * small logo mark takes its place above the card.
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
        {/* The reference site's own texture: a fine technical grid plus an
            ambient glow, both held at single-digit opacity so they read as
            structure rather than decoration ("les grilles et filets
            techniques guident l'oeil sans concurrencer le message"). */}
        <span aria-hidden className="grid-lines glow-brand pointer-events-none absolute inset-0" />

        <div className="relative flex items-center gap-2.5">
          <span className="bg-brand-accent text-brand-accent-foreground flex size-9 items-center justify-center rounded-lg">
            <Sparkles className="size-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">{t.common.appName}</span>
        </div>

        <div className="relative space-y-6">
          <span className="cta-label border-brand-surface-foreground/20 bg-brand-surface-foreground/10 inline-flex items-center rounded-full border px-3 py-1">
            {t.auth.heroBadge}
          </span>
          <p className="font-display max-w-sm text-4xl leading-tight font-bold tracking-tight text-balance">
            {t.auth.heroTagline}
          </p>
          <ul className="space-y-3">
            {t.auth.heroFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="text-brand-accent mt-0.5 size-4 shrink-0" />
                <span className="text-brand-surface-foreground/90">{feature}</span>
              </li>
            ))}
          </ul>
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
          <div className="mb-6 flex items-center gap-2.5 md:hidden">
            <span className="bg-brand-accent text-brand-accent-foreground flex size-9 items-center justify-center rounded-lg">
              <Sparkles className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              {t.common.appName}
            </span>
          </div>

          <div className="bg-card text-card-foreground border-border rounded-xl border p-6 shadow-sm sm:p-8">
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
