'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

import NotificationBell from '@/app/(restricted)/components/NotificationBell';
import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { getPageMeta } from '@/lib/pageMeta';
import { t } from '@/locales';

import { QuickNavSearch } from './QuickNavSearch';
import ProfilePopup from './ProfilePopup';

/**
 * The topbar. Sits only above the content column — the brand mark lives in
 * `Sidebar` now, not here — so the left slot is the current page's context
 * (organization, then page title) rather than the wordmark. Mirrors
 * `ai-agents-platform`'s `Topbar`: the same two-line left slot, a search box
 * in the middle, and controls on the right.
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
        <NotificationBell />
        <ProfilePopup />
      </div>
    </header>
  );
}
