'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, ENABLED_HREFS, type NavItem } from '@/constants/navItems';
import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useUser } from '@/app/(restricted)/context/UserContext';
import { t } from '@/locales';
import OrganizationSwitcher from './OrganizationSwitcher';

function isAnyChildActive(item: NavItem, pathname: string): boolean {
  if (!item.children) return false;
  return item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'));
}

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.children) return isAnyChildActive(item, pathname);
  return pathname === item.href || pathname.startsWith(item.href + '/');
}

function groupBtnClass(active: boolean) {
  return cn(
    'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5',
    'text-sm font-medium uppercase  transition-all duration-150',
    active
      ? 'bg-sidebar-accent text-white shadow-sm'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
  );
}

function subLinkClass(active: boolean) {
  return cn(
    'block rounded-lg px-3 py-2 text-[13px] font-normal  transition-all duration-150',
    active
      ? 'bg-sidebar-accent text-white shadow-sm'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
  );
}

function simpleLinkClass(active: boolean) {
  return cn(
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5',
    'text-sm font-medium uppercase  transition-all duration-150',
    active
      ? 'bg-sidebar-accent text-white shadow-sm'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
  );
}

const SUBMENU_LIST = 'mt-1 ml-8 space-y-0.5 border-l-2 border-border pl-3';

function NavGroup({ item, pathname }: Readonly<{ item: NavItem; pathname: string }>) {
  const { hasFunctional } = usePermissions();
  const childActive = isAnyChildActive(item, pathname);
  const [open, setOpen] = useState(childActive);

  const visibleChildren =
    item.children?.filter((c) => {
      // An "overview" child with no requiredFunction of its own (e.g. the group's
      // own landing page) inherits the group's requiredFunction — otherwise it
      // would show for users who lack the group's permission (and flash in before
      // permissions resolve). Only truly ungated children stay always-visible.
      const gate = c.requiredFunction ?? item.requiredFunction;
      if (!gate) return true;
      return hasFunctional(gate, 'read');
    }) ?? [];

  // A group with no visible children is nothing but an empty expandable header —
  // don't render it at all.
  if (visibleChildren.length === 0) return null;

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={groupBtnClass(childActive && !open)}
      >
        <span className="flex items-center gap-3">
          <span
            className={cn(
              'shrink-0',
              childActive && !open ? 'text-white' : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
          </span>
          <span>{item.label}</span>
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
        )}
      </button>

      {open && visibleChildren.length > 0 && (
        <ul className={SUBMENU_LIST}>
          {visibleChildren.map((child) => {
            const active = pathname === child.href || pathname.startsWith(child.href + '/');
            return (
              <li key={child.href}>
                <Link href={child.href} className={subLinkClass(active)}>
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

function NavLeaf({ item, pathname }: Readonly<{ item: NavItem; pathname: string }>) {
  const active = isItemActive(item, pathname);
  return (
    <li>
      <Link href={item.href} className={simpleLinkClass(active)}>
        <span className={cn('shrink-0', active ? 'text-white' : 'text-muted-foreground')}>
          <item.icon className="h-4 w-4" />
        </span>
        <span>{item.label}</span>
      </Link>
    </li>
  );
}

type SidebarProps = Readonly<{ isOpen: boolean; onClose: () => void }>;

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { hasFunctional } = usePermissions();
  // Platform-admin items are gated on the account flag, not on a permission code
  // — see NavItem.superuserOnly. The flag reaching the browser grants nothing:
  // the page redirects server-side and the endpoints re-check.
  const { session } = useUser();
  const isSuperuser = Boolean(session.user.is_superuser);

  const allItems = NAV_ITEMS.flatMap((item) => {
    if (item.superuserOnly && !isSuperuser) return [];
    if (item.children) {
      const enabledChildren = item.children.filter((c) => ENABLED_HREFS.includes(c.href));
      if (enabledChildren.length === 0) return [];
      return [{ ...item, children: enabledChildren }];
    }
    if (!ENABLED_HREFS.includes(item.href)) return [];
    if (
      item.requiredFunction &&
      !hasFunctional(item.requiredFunction, item.requiredLevel ?? 'read')
    )
      return [];
    return [item];
  });

  // Grouped by the item's own `section` rather than by slicing at the first
  // workspace item: the slice worked while there were exactly two sections, and
  // silently put a third section's items under the workspace heading.
  const sectionItems = (section: string) => allItems.filter((i) => i.section === section);
  const mainItems = sectionItems(t.navigation.sections.main);
  const workspaceItems = sectionItems(t.navigation.sections.workspace);
  const platformItems = sectionItems(t.navigation.sections.platform);

  return (
    <aside
      className={cn(
        'flex w-[280px] shrink-0 flex-col overflow-hidden border-r border-r-th-sidebar-border bg-sidebar',
        // Mobile: fixed overlay drawer
        'fixed inset-y-0 left-0 z-50 h-full transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: static in layout, always visible
        'lg:relative lg:translate-x-0 lg:transition-none'
      )}
    >
      {/* Mobile close button */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
        <span className="text-xs font-bold uppercase text-muted-foreground">{t.common.menu}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.common.closeMenu}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Renders nothing when the user belongs to one organization, which is
          every user of a single-tenant deployment — so no flag check is needed here. */}
      <div className="pt-3">
        <OrganizationSwitcher />
      </div>
      <nav className="flex-1 overflow-y-auto px-4 pb-6 pt-2 sm:px-5">
        {/* MAIN section */}
        <div>
          <p className="mb-2 px-1 text-xs font-black uppercase text-muted-foreground">
            {t.navigation.sections.main}
          </p>
          <ul className="space-y-0.5">
            {mainItems.map((item) =>
              item.children ? (
                <NavGroup key={item.href} item={item} pathname={pathname} />
              ) : (
                <NavLeaf key={item.href} item={item} pathname={pathname} />
              )
            )}
          </ul>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-border" />

        {/* WORKSPACE section */}
        <div>
          <p className="mb-2 px-1 text-xs font-black uppercase text-muted-foreground">
            {t.navigation.sections.workspace}
          </p>
          <ul className="space-y-0.5">
            {workspaceItems.map((item) =>
              item.children ? (
                <NavGroup key={item.href} item={item} pathname={pathname} />
              ) : (
                <NavLeaf key={item.href} item={item} pathname={pathname} />
              )
            )}
          </ul>
        </div>

        {/* PLATFORM section — empty, and so absent, for everyone but superusers. */}
        {platformItems.length > 0 ? (
          <>
            <div className="my-4 border-t border-border" />
            <div>
              <p className="mb-2 px-1 text-xs font-black uppercase text-muted-foreground">
                {t.navigation.sections.platform}
              </p>
              <ul className="space-y-0.5">
                {platformItems.map((item) => (
                  <NavLeaf key={item.href} item={item} pathname={pathname} />
                ))}
              </ul>
            </div>
          </>
        ) : null}
      </nav>
    </aside>
  );
}
