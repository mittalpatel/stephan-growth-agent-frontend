import Link from 'next/link';
import { Bot, Database, Globe, Inbox, MessagesSquare, Sparkles, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from '@/lib/i18n';
import { t } from '@/locales';

const FEATURE_ICONS = [Bot, Database, Globe, MessagesSquare, UserPlus, Inbox] as const;

/**
 * The public marketing homepage (`/`). Reachable only when signed out —
 * `src/proxy.ts` sends an authenticated request straight to `DEFAULT_LANDING`
 * before this ever renders, and `page.tsx` checks the session again itself
 * as a second line of defense, the same pattern `(public)/layout.tsx` uses
 * for `/login` and friends.
 *
 * A server component throughout: nothing here needs client state, and
 * `Sign in` / `Get started` are just links to `/login` and `/signup/create`.
 */
export default function LandingPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-background/85 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="bg-brand-accent text-brand-accent-foreground flex size-8 items-center justify-center rounded-lg">
              <Sparkles className="size-4" />
            </span>
            <span className="font-display text-[15px] font-bold tracking-tight">
              {t.common.appName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">{t.marketing.nav.signIn}</Link>
            </Button>
            <Button asChild>
              <Link href="/signup/create">{t.marketing.nav.getStarted}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <span
            aria-hidden
            className="text-primary/[0.07] pointer-events-none absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-size-[24px_24px]"
          />
          <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <span className="border-brand-accent/40 bg-brand-accent/10 text-brand-accent inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium">
              {t.marketing.hero.badge}
            </span>
            <h1 className="font-display mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {t.marketing.hero.heading}
            </h1>
            <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-lg text-balance">
              {t.marketing.hero.subheading}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-11 gap-1.5 px-6 text-base font-semibold" asChild>
                <Link href="/signup/create">
                  <Sparkles className="size-4" />
                  {t.marketing.hero.primaryCta}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-6 text-base font-semibold"
                asChild
              >
                <Link href="/login">{t.marketing.hero.secondaryCta}</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto grid max-w-3xl grid-cols-3 gap-4 px-4 pb-20 sm:px-6">
            {t.marketing.stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="text-center">
                  <p className="font-display text-3xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-muted/40 border-y py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight">
                {t.marketing.features.heading}
              </h2>
              <p className="text-muted-foreground mt-3 text-base">
                {t.marketing.features.subheading}
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {t.marketing.features.items.map((feature, index) => {
                const Icon = FEATURE_ICONS[index];
                return (
                  <Card key={feature.title}>
                    <CardContent>
                      <span className="bg-brand-accent/15 text-brand-accent flex size-10 items-center justify-center rounded-lg">
                        <Icon className="size-5" />
                      </span>
                      <h3 className="font-display mt-4 text-base font-bold">{feature.title}</h3>
                      <p className="text-muted-foreground mt-1.5 text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="font-display text-center text-3xl font-bold tracking-tight">
              {t.marketing.steps.heading}
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {t.marketing.steps.items.map((step, index) => (
                <div key={step.title}>
                  <span className="bg-primary text-primary-foreground font-display flex size-9 items-center justify-center rounded-full text-sm font-bold">
                    {index + 1}
                  </span>
                  <h3 className="font-display mt-4 text-base font-bold">{step.title}</h3>
                  <p className="text-muted-foreground mt-1.5 text-sm">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-brand-surface text-brand-surface-foreground py-16">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              {t.marketing.cta.heading}
            </h2>
            <p className="text-brand-surface-foreground/80 mt-3 text-base">
              {t.marketing.cta.subheading}
            </p>
            <Button
              size="lg"
              className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90 mt-7 h-11 gap-1.5 px-6 text-base font-semibold"
              asChild
            >
              <Link href="/signup/create">
                <Sparkles className="size-4" />
                {t.marketing.cta.button}
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="bg-brand-accent text-brand-accent-foreground flex size-7 items-center justify-center rounded-lg">
              <Sparkles className="size-3.5" />
            </span>
            <div>
              <p className="font-display font-bold">{t.common.appName}</p>
              <p className="text-muted-foreground text-xs">{t.marketing.footer.tagline}</p>
            </div>
          </div>

          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            <Link
              href="/legal/privacy-policy"
              className="underline-offset-4 hover:underline hover:text-foreground"
            >
              {t.legal.privacyLinkLabel}
            </Link>
            <Link
              href="/legal/terms-conditions"
              className="underline-offset-4 hover:underline hover:text-foreground"
            >
              {t.legal.termsLinkLabel}
            </Link>
            <span>{format(t.auth.copyright, { year: String(currentYear) })}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
