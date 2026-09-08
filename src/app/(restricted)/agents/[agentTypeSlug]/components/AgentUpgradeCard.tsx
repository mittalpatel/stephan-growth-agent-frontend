import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

import { t } from '@/locales';

type Props = Readonly<{
  title: string;
  bullets: readonly string[];
  cta: string;
}>;

/**
 * The gold Level 2 panel at the foot of an agent's Overview tab, matching
 * `UpgradeCard` in the `ai-agents-platform` reference.
 *
 * The CTA is a link to billing rather than the reference's modal: there is no
 * self-serve upgrade to run, and a button that opens a dialog saying "contact
 * us" is a longer route to the same page. Copy per agent lives in
 * `t.agents.types.roadmap[slug].upgrade`.
 */
export function AgentUpgradeCard({ title, bullets, cta }: Props) {
  return (
    <section className="border-brand-accent/25 bg-brand-accent/5 flex flex-col items-start justify-between gap-5 rounded-xl border p-6 sm:flex-row sm:items-center">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="text-brand-accent-strong size-4" aria-hidden />
          <p className="text-brand-accent-strong text-xs font-semibold tracking-wider uppercase">
            {t.agents.tiers.level2Eyebrow}
          </p>
        </div>
        <h3 className="font-display mb-2.5 text-[17px] font-bold">{title}</h3>
        <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {bullets.map((bullet) => (
            <li key={bullet} className="text-muted-foreground flex items-center gap-2 text-sm">
              <Check className="text-brand-accent-strong size-3.5 shrink-0" aria-hidden />
              {bullet}
            </li>
          ))}
        </ul>
      </div>
      <Link
        href="/organization/billing"
        className="bg-secondary text-secondary-foreground hover:bg-secondary/80 shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
      >
        {cta}
      </Link>
    </section>
  );
}
