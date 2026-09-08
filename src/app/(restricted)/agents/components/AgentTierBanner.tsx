import Link from 'next/link';

import { t } from '@/locales';

/**
 * The dark Level 4 banner that closes the marketplace, matching the
 * reference's "Tier 4 · Customized" panel.
 *
 * It is deliberately not a card: the roster above is what the organization
 * has, and this is the one thing on the page that has to be bought, so it
 * reads as a different surface. `bg-foreground`/`text-background` inverts with
 * the theme rather than pinning a dark slab into dark mode.
 */
export function AgentTierBanner() {
  return (
    <section className="bg-foreground text-background flex flex-wrap items-center justify-between gap-6 rounded-xl p-7">
      <div className="max-w-lg">
        <p className="mb-1.5 text-xs font-semibold tracking-wider uppercase opacity-60">
          {t.agents.tiers.banner.eyebrow}
        </p>
        <h2 className="font-display mb-1.5 text-xl font-bold">{t.agents.tiers.banner.title}</h2>
        <p className="text-sm leading-relaxed opacity-75">{t.agents.tiers.banner.description}</p>
      </div>
      <Link
        href="/organization/billing"
        className="bg-background text-foreground hover:bg-background/90 shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
      >
        {t.agents.tiers.banner.action}
      </Link>
    </section>
  );
}
