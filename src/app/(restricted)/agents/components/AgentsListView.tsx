'use client';

import { AlertTriangle } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { AGENT_TYPE_CATEGORIES } from '@/constants/agentTypes';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { ALL_CATEGORIES, useAgentCatalog, type CatalogCategory } from '../hooks/useAgentCatalog';
import { AgentsGrid } from './AgentsGrid';
import { AgentTierBanner } from './AgentTierBanner';
import { AgentsTableSkeleton } from './AgentsTableSkeleton';

const CATEGORY_TABS: readonly CatalogCategory[] = [ALL_CATEGORIES, ...AGENT_TYPE_CATEGORIES];

/**
 * The agents marketplace: all four predefined agent kinds in one grid,
 * mirroring the `ai-agents-platform` reference's single marketplace page.
 *
 * This replaces the split this app used to have, where `/agents` listed only
 * the organization's provisioned agents (one card) and a separate
 * `/agents/types` page listed the roadmap. `useAgentCatalog()` owns the
 * merge; this component is a pure presenter over it.
 *
 * No create action: an organization's agents are a fixed, auto-provisioned
 * roster (`AgentService.provision_defaults`, backend 2026-09-07) — there is
 * no tenant-facing `POST /agents/` any more. Cards for types that aren't
 * provisioned are shown but not linked. See
 * `context/app/(restricted)/agents/page.md`.
 */
export function AgentsListView() {
  const catalog = useAgentCatalog();

  function renderBody() {
    if (catalog.isLoading) {
      return <AgentsTableSkeleton rows={4} />;
    }

    if (catalog.isError) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title={t.agents.list.errorTitle}
          description={t.agents.list.errorDescription}
          action={
            <Button variant="outline" onClick={() => void catalog.refetch()}>
              {t.buttons.tryAgain}
            </Button>
          }
        />
      );
    }

    if (catalog.entries.length === 0) {
      return (
        <EmptyState
          title={t.agents.list.emptyFilteredTitle}
          description={t.agents.marketplace.emptyCategory}
          action={
            <Button variant="outline" onClick={() => catalog.onCategoryChange(ALL_CATEGORIES)}>
              {t.buttons.resetFilters}
            </Button>
          }
        />
      );
    }

    return <AgentsGrid entries={catalog.entries} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={t.agents.marketplace.eyebrow}
        title={t.agents.marketplace.title}
        description={t.agents.marketplace.description}
      />

      <div
        role="tablist"
        aria-label={t.agents.title}
        className="bg-muted flex w-fit items-center gap-1 rounded-lg p-1"
      >
        {CATEGORY_TABS.map((tab) => {
          const active = catalog.category === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => catalog.onCategoryChange(tab)}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors',
                active
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.agents.marketplace.categories[tab]}
            </button>
          );
        })}
      </div>

      {renderBody()}

      <AgentTierBanner />
    </div>
  );
}
