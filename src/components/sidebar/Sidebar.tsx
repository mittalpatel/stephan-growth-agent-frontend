'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BookOpen, Building2, ChevronDown, ChevronRight, X } from 'lucide-react';
import { BrandMark } from '@/components/common/BrandMark';
import { isPlatformBrand } from '@/lib/publicBranding';
import { PlatformLogo } from '@/components/common/PlatformLogo';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, ENABLED_HREFS, type NavItem } from '@/constants/navItems';
import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { useOrgBranding } from '@/app/(restricted)/hooks/useOrgBranding';
import { useUser } from '@/app/(restricted)/context/UserContext';
import { t } from '@/locales';

function isAnyChildActive(item: NavItem, pathname: string): boolean {
  if (!item.children) return false;
  return item.children.some((c) => pathname === c.href || pathname.startsWith(c.href + '/'));
}

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.children) return isAnyChildActive(item, pathname);
  return pathname === item.href || pathname.startsWith(item.href + '/');
}

// Flat pills, not the uppercase/shadowed treatment this replaced: a light
// tinted fill on the active row is what `ai-agents-platform`'s sidebar uses,
// and it reads calmer at this density than a solid fill on every row.
function navRowClass(active: boolean) {
  return cn(
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
    active
      ? 'bg-primary/10 text-primary-strong'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
  );
}

const SUBMENU_LIST = 'mt-0.5 ml-8 space-y-0.5 border-l-2 border-border pl-3';

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
        className={cn(navRowClass(childActive && !open), 'justify-between')}
      >
        <span className="flex items-center gap-2.5">
          <item.icon className="size-[17px] shrink-0" strokeWidth={2} />
          <span className="truncate">{item.label}</span>
        </span>
        {open ? (
          <ChevronDown className="size-3.5 shrink-0 opacity-60" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 opacity-60" />
        )}
      </button>

      {open && (
        <ul className={SUBMENU_LIST}>
          {visibleChildren.map((child) => {
            const active = pathname === child.href || pathname.startsWith(child.href + '/');
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className={cn(
                    'block rounded-lg px-3 py-1.5 text-[13px] transition-colors',
                    active
                      ? 'text-primary-strong font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
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
      <Link href={item.href} className={navRowClass(active)}>
        <item.icon className="size-[17px] shrink-0" strokeWidth={2} />
        <span className="truncate">{item.label}</span>
      </Link>
    </li>
  );
}

function NavSection({
  title,
  items,
  pathname,
}: Readonly<{ title: string; items: NavItem[]; pathname: string }>) {
  if (items.length === 0) return null;
  return (
    <div className="mb-5">
      <p className="text-muted-foreground mb-1.5 px-3 text-[10px] font-semibold tracking-wider uppercase">
        {title}
      </p>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) =>
          item.children ? (
            <NavGroup key={item.href} item={item} pathname={pathname} />
          ) : (
            <NavLeaf key={item.href} item={item} pathname={pathname} />
          )
        )}
      </ul>
    </div>
  );
}

/** Initials from a full name, capped at 2 characters — matches ProfilePopup's own rule. */
function initialsOf(fullName: string | undefined): string {
  return (
    fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?'
  );
}

type SidebarProps = Readonly<{ isOpen: boolean; onClose: () => void }>;

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const branding = useOrgBranding();
  const pathname = usePathname();
  const { hasFunctional, role } = usePermissions();
  // Platform-admin items are gated on the account flag, not on a permission code
  // — see NavItem.superuserOnly. The flag reaching the browser grants nothing:
  // the page redirects server-side and the endpoints re-check.
  const { session } = useUser();
  const isSuperuser = Boolean(session.user.is_superuser);
  const { organization } = useOrganization();

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
        'bg-sidebar flex w-64 shrink-0 flex-col border-r',
        // Mobile: fixed overlay drawer. Desktop: sticky in the flex row and as
        // tall as the viewport, so its own nav scrolls independently of the
        // page — matching the full-height rail this shell is styled after,
        // rather than the header-spans-everything layout it replaced.
        'fixed inset-y-0 left-0 z-50 h-full transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:transition-none'
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b px-4">
        {isPlatformBrand(branding) ? (
          // `h-8` keeps the wide (5.7:1) wordmark inside the 256px sidebar with
          // the header's own padding on both sides.
          <PlatformLogo className="h-8" />
        ) : (
          <>
            <BrandMark
              logoUrl={branding.logoUrl}
              colorPrimary={branding.colorPrimary}
              onColorPrimary={branding.onColorPrimary}
            />
            <span className="font-display truncate text-[15px] font-bold tracking-tight">
              {branding.displayName}
            </span>
          </>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={t.common.closeMenu}
          className="text-muted-foreground hover:bg-accent hover:text-foreground ml-auto rounded-md p-1.5 lg:hidden"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        <NavSection title={t.navigation.sections.main} items={mainItems} pathname={pathname} />
        <NavSection
          title={t.navigation.sections.workspace}
          items={workspaceItems}
          pathname={pathname}
        />
        <NavSection
          title={t.navigation.sections.platform}
          items={platformItems}
          pathname={pathname}
        />
      </nav>

      <div className="border-t py-2.5">
        {/* A plain help link, not a NAV_ITEMS entry: `/guide` is a public page
            outside `(restricted)` with its own chrome, not a gated internal
            route, so it doesn't belong in the permission-filtered nav list
            above or need an active/pathname state. */}
        <Link
          href="/guide"
          className="text-muted-foreground hover:bg-accent hover:text-foreground mx-3 mb-2 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors"
        >
          <BookOpen className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-medium">{t.navigation.guideLink}</span>
        </Link>

        {/* A single organization per user (no switcher, no "create another"):
            a plain link to its settings, not a dropdown with nothing to
            switch between. `ai-agents-platform`'s own equivalent box isn't a
            multi-org switcher either — it's a shortcut into settings/billing. */}
        {organization && (
          <Link
            href="/organization"
            className="hover:bg-accent mx-3 mb-2 flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors"
          >
            <Building2 className="text-muted-foreground size-4 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-medium">{organization.name}</span>
          </Link>
        )}

        {/* A second, read-only identity card below it — the sidebar footer
            this shell is modeled on stacks "current org" over "current user"
            rather than relying on the topbar's ProfilePopup alone. This one
            is display-only; sign-out and the profile link still live on
            ProfilePopup, so there's exactly one place that actually acts on
            the account. */}
        <div className="flex items-center gap-2.5 px-3 pt-1">
          <div className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            {initialsOf(session.user.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{session.user.full_name}</p>
            <p className="text-muted-foreground truncate text-[11px]">{role?.name ?? ''}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
