'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useState } from 'react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { ENABLED_HREFS, NAV_ITEMS } from '@/constants/navItems';
import { t } from '@/locales';

/**
 * A real (if minimal) quick-nav search, not a decorative input: typing a
 * label and pressing Enter jumps to the first enabled nav destination whose
 * label contains it. `ai-agents-platform`'s topbar has a search box in this
 * slot; a box that does nothing would be a control wired to nothing
 * (AGENTS.md), so this one actually navigates rather than only visually
 * matching the prototype.
 *
 * Only searches what the sidebar itself would show — enabled and permitted —
 * so it can never jump somewhere `PermissionGuard` would immediately bounce
 * the user back out of.
 */
export function QuickNavSearch() {
  const [value, setValue] = useState('');
  const router = useRouter();
  const { hasFunctional } = usePermissions();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const query = value.trim().toLowerCase();
    if (!query) return;

    const candidates = NAV_ITEMS.flatMap((item) => [item, ...(item.children ?? [])]);
    const match = candidates.find((item) => {
      if (!ENABLED_HREFS.includes(item.href)) return false;
      const gate = item.requiredFunction;
      if (gate && !hasFunctional(gate, 'read')) return false;
      return item.label.toLowerCase().includes(query);
    });

    if (match) {
      router.push(match.href);
      setValue('');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative hidden max-w-sm flex-1 md:flex">
      <Search className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 my-auto size-4" />
      <label className="sr-only" htmlFor="quick-nav-search">
        {t.common.navSearchLabel}
      </label>
      <input
        id="quick-nav-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t.common.navSearchPlaceholder}
        className="border-border bg-background focus-visible:border-ring w-full rounded-lg border py-2 pr-3 pl-9 text-sm outline-none"
      />
    </form>
  );
}
