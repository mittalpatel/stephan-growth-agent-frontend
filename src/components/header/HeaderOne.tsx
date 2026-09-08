'use client';

import Link from 'next/link';
import { HelpCircle, Menu, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';

import NotificationBell from '@/app/(restricted)/components/NotificationBell';
import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { Button } from '@/components/ui/button';
import { format } from '@/lib/i18n';
import { getPageMeta } from '@/lib/pageMeta';
import { t } from '@/locales';

import { QuickNavSearch } from './QuickNavSearch';
import ProfilePopup from './ProfilePopup';

// There is no trial system in this product yet — this is a fixed display
// value, the same kind of Sprint 1 placeholder as the metrics on
// `DashboardView`, not a claim about a real subscription state. Wire it to
// real organization data (creation date + plan) the day that exists, the same
// way every other mock number in this app gets replaced.
const TRIAL_DAYS_REMAINING = 21;

/**
 * The topbar. Sits only above the content column — the brand mark lives in
 * `Sidebar` now, not here — so the left slot is the current page's context
 * (organization, then page title) rather than the wordmark. Mirrors
 * `ai-agents-platform`'s `Topbar` layout in full: search, a trial indicator,
 * help, notifications, a persistent "Explore agents" shortcut, and the
 * profile avatar.
 */
export default function HeaderOne({ onMenuClick }: Readonly<{ onMenuClick?: () => void }>) {
  const pathname = usePathname();
  const { title, subtitle } = getPageMeta(pathname);
  const { organization } = useOrganization();

  return (
    <header className="bg-background/85 sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md md:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label={t.common.openMenu}
        className="text-muted-foreground hover:bg-accent hover:text-foreground -ml-1 flex items-center justify-center rounded-md p-2 lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0 shrink-0">
        {organization && (
          <p className="text-muted-foreground truncate text-xs">{organization.name}</p>
        )}
        {title && <p className="truncate text-sm font-semibold">{title}</p>}
        {subtitle && <p className="text-muted-foreground truncate text-xs">{subtitle}</p>}
      </div>

      <QuickNavSearch />

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className="border-brand-accent-strong/30 bg-brand-accent/10 text-brand-accent-strong hidden items-center rounded-full border px-3 py-1.5 text-xs font-semibold sm:inline-flex">
          {format(t.header.trialBadge, { days: String(TRIAL_DAYS_REMAINING) })}
        </span>

        <a
          href={`mailto:support@ybinspire.com?subject=${encodeURIComponent(t.header.helpEmailSubject)}`}
          aria-label={t.header.help}
          title={t.header.help}
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-9 items-center justify-center rounded-full"
        >
          <HelpCircle className="size-[17px]" />
        </a>

        <NotificationBell />

        <Button variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex" asChild>
          <Link href="/agents">
            <Sparkles className="size-3.5" />
            {t.dashboard.actions.exploreAgents}
          </Link>
        </Button>

        <ProfilePopup />
      </div>
    </header>
  );
}
