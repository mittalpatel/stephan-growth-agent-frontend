'use client';

import Link from 'next/link';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/locales';
import { cn } from '@/lib/utils';

/**
 * Switches the active organization, and is also where a new one gets created.
 *
 * Always renders when the user has at least one organization (even exactly
 * one) — self-serve creation means "how many orgs does this user currently
 * have" no longer implies "can this deployment have more than one", so hiding
 * the control below two organizations would hide the only way to create a
 * second one. A user with **zero** organizations sees a bare "create" button
 * instead of a dropdown, since there is nothing yet to switch between.
 *
 * The create action is always visible; whether it succeeds is the backend's
 * call (`MULTI_TENANT_ENABLED`/`ALLOW_SELF_SERVE_ORG_CREATION`). A genuinely
 * single-tenant deployment that disabled both would surface that as a normal
 * field error on `/organization/new`, the same way the ceiling rule surfaces
 * as a 400 rather than a hidden control — the server is the real gate here,
 * this is a courtesy.
 */
export default function OrganizationSwitcher() {
  const { organization, organizations, isSwitching, switchOrganization } = useOrganization();

  if (isSwitching) {
    // A skeleton, not a spinner: the switch replaces the whole page's data, and a
    // shape that matches the trigger keeps the sidebar from reflowing under it.
    return <Skeleton className="mx-3 mb-2 h-10 rounded-md" />;
  }

  if (!organization) {
    return (
      <div className="px-3 pb-2">
        <Button variant="outline" className="w-full justify-start gap-2" asChild>
          <Link href="/organization/new">
            <Plus className="size-4" aria-hidden />
            {t.organizations.switcher.createFirst}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="px-3 pb-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex w-full items-center gap-2 rounded-md border border-border bg-background',
            'px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none'
          )}
          aria-label={t.organizations.switcher.label}
        >
          <Building2 className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-medium">{organization.name}</span>
          <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[248px]">
          <DropdownMenuLabel>{t.organizations.switcher.label}</DropdownMenuLabel>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onSelect={() => void switchOrganization(org.id)}
              className="gap-2"
            >
              <span className="min-w-0 flex-1 truncate">{org.name}</span>
              {org.id === organization.id ? (
                <Check className="size-4 shrink-0" aria-hidden />
              ) : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/organization/new" className="gap-2">
              <Plus className="size-4" aria-hidden />
              {t.organizations.switcher.createNew}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
