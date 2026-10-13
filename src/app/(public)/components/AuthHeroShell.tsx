'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

import { BrandMark } from '@/components/common/BrandMark';
import { Button } from '@/components/ui/button';
import { orgSurfaceStyle } from '@/lib/orgColors';
import { usePublicBranding } from '@/providers/PublicBrandingProvider';

import { format } from '@/lib/i18n';
import { LanguageSelect } from '@/components/common/LanguageSelect';
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
 *
 * `cta` is optional and off by default — every page using this shell shares it,
 * but a "start for free" style prompt only belongs on `/login`, so only
 * `SignIn.tsx` passes it.
 */
export default function AuthHeroShell({
  title,
  subtitle,
  cta,
  children,
}: Readonly<{
  title: string;
  subtitle?: string;
  cta?: { label: string; href: string };
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();
  const brand = usePublicBranding();
  const copyright = format(t.auth.copyright, {
    year: String(currentYear),
    name: brand.displayName,
  });

  return (
    <main className="bg-muted/40 flex min-h-screen">
      <div
        style={orgSurfaceStyle(brand.colorPrimary, brand.onColorPrimary)}
        className="bg-brand-surface text-brand-surface-foreground relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 md:flex"
      >
        {/* A faint dot grid instead of a gradient blob: it reads as texture at
            any zoom level, so it can't band the way a blurred circle did. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:24px_24px] text-brand-surface-foreground/10"
        />

        <div className="relative flex items-center gap-2.5">
          {/* No org colors passed: on the org-colored panel the tile inherits the
              inverted accent pair `orgSurfaceStyle` sets, so it stays visible. */}
          <BrandMark logoUrl={brand.logoUrl} className="size-9" iconClassName="size-5" />
          <span className="font-display text-lg font-bold tracking-tight">{brand.displayName}</span>
        </div>

        <div className="relative space-y-6">
          <span className="border-brand-surface-foreground/20 bg-brand-surface-foreground/10 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
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

          {cta && (
            <Button asChild variant="cta" className="h-11 px-6 text-base font-semibold">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          )}
        </div>

        <p className="text-brand-surface-foreground/70 relative text-xs">{copyright}</p>
      </div>

      {/* `min-w-0` is load-bearing: this is a flex item, and a flex item's
          default `min-width: auto` refuses to shrink below its content's
          min-content width. Without it the panel stayed 480px wide inside a
          375px viewport on `/login/otp` (the 6-box code input is the widest
          thing it has to hold), scrolling every auth page sideways on a small
          phone. */}
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-4 flex justify-end empty:hidden">
            <LanguageSelect />
          </div>
          <div className="mb-6 flex items-center gap-2.5 md:hidden">
            <BrandMark
              logoUrl={brand.logoUrl}
              colorPrimary={brand.colorPrimary}
              onColorPrimary={brand.onColorPrimary}
              className="size-9"
              iconClassName="size-5"
            />
            <span className="font-display text-lg font-bold tracking-tight">
              {brand.displayName}
            </span>
          </div>

          {cta && (
            <Button
              asChild
              variant="cta"
              className="mb-6 h-11 w-full text-base font-semibold md:hidden"
            >
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          )}

          <div className="bg-card text-card-foreground border-border rounded-xl border p-6 shadow-sm sm:p-8">
            <div className="mb-6 space-y-1.5">
              <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
            </div>
            {children}
          </div>

          <p className="text-muted-foreground mt-6 text-center text-xs md:hidden">{copyright}</p>
        </div>
      </div>
    </main>
  );
}
