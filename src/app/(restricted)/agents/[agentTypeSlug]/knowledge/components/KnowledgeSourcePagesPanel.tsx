'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import type { StatusTone } from '@/components/common/StatusBadge';
import { format, formatNumber, formatRelativeTime } from '@/lib/i18n';
import { t } from '@/locales';
import type { KnowledgeSourceListItem, PageStatus } from '@/types/knowledge';

import { useKnowledgeSourcePages } from '../hooks/useKnowledgeSourcePages';

type Props = Readonly<{
  source: KnowledgeSourceListItem | null;
  onOpenChange: (open: boolean) => void;
}>;

const PAGE_STATUS_TONES: Record<PageStatus, StatusTone> = {
  discovered: 'neutral',
  ready: 'success',
  failed: 'danger',
  // Warning, not danger: both are deliberate skips by the extractor, not
  // errors, but the operator still needs to know the page they picked is not
  // in the index.
  low_quality: 'warning',
  duplicate: 'warning',
};

/** Only the two outcomes whose reason isn't self-evident from the label. */
const PAGE_STATUS_HINTS: Partial<Record<PageStatus, string>> = {
  low_quality: t.knowledge.pages.pageStatusHint.low_quality,
  duplicate: t.knowledge.pages.pageStatusHint.duplicate,
};

/**
 * A website source's page list, opened from its row menu: shows each page's
 * crawl health (last content change, HTTP status) and lets the user recrawl
 * a chosen subset via the backend's 2026-09-09 `recrawl-pages/` endpoint.
 * Distinct from `DiscoveredUrlsReview` in `AddWebsiteDialog.tsx`, which is
 * the one-time, pre-extraction wizard step for a brand-new source.
 */
export function KnowledgeSourcePagesPanel({ source, onOpenChange }: Props) {
  const { pages, isLoading, isError, recrawlSelected, isRecrawling } = useKnowledgeSourcePages(
    source?.website_source_id ?? null
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { can } = usePermissions();
  const canRecrawl = can('knowledge', 'execute');

  const countByStatus = (status: PageStatus) =>
    pages.filter((page) => page.status === status).length;
  const summaryRows = [
    { key: 'total', label: t.knowledge.pages.summary.total, value: pages.length },
    { key: 'ready', label: t.knowledge.pages.summary.indexed, value: countByStatus('ready') },
    {
      key: 'pending',
      label: t.knowledge.pages.summary.notExtracted,
      value: countByStatus('discovered'),
    },
    { key: 'failed', label: t.knowledge.pages.summary.failed, value: countByStatus('failed') },
    {
      key: 'skipped',
      label: t.knowledge.pages.summary.skipped,
      value: countByStatus('low_quality') + countByStatus('duplicate'),
    },
  ].filter((row) => row.key === 'total' || row.value > 0);

  const close = (open: boolean) => {
    if (!open) setSelectedIds(new Set());
    onOpenChange(open);
  };

  const toggle = (pageId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(pageId);
      else next.delete(pageId);
      return next;
    });
  };

  return (
    <Sheet open={Boolean(source)} onOpenChange={close}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t.knowledge.pages.title}</SheetTitle>
          <SheetDescription>
            {format(t.knowledge.pages.description, { name: source?.display_name ?? '' })}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="text-muted-foreground size-6 animate-spin" aria-hidden />
            </div>
          )}

          {!isLoading && isError && (
            <EmptyState
              title={t.knowledge.pages.errorTitle}
              description={t.knowledge.pages.errorDescription}
            />
          )}

          {!isLoading && !isError && pages.length === 0 && (
            <EmptyState title={t.knowledge.pages.empty} />
          )}

          {/* What the crawl actually produced, counted from the rows already
              loaded. Without this the panel answers "which pages exist" but
              not "how did it go", which is the first thing anyone asks after a
              crawl finishes. */}
          {!isLoading && !isError && pages.length > 0 && (
            <dl className="divide-y rounded-md border">
              {summaryRows.map((row) => (
                <div key={row.key} className="flex items-center justify-between px-3 py-2 text-sm">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="font-medium tabular-nums">{formatNumber(row.value)}</dd>
                </div>
              ))}
            </dl>
          )}

          {!isLoading && !isError && pages.length > 0 && (
            <div className="space-y-1">
              {pages.map((page) => {
                const isFailedStatus = (page.http_status ?? 200) >= 400;
                const hint = PAGE_STATUS_HINTS[page.status];
                return (
                  <div
                    key={page.id}
                    className="hover:bg-accent flex items-start gap-2 rounded-md px-2 py-2 text-sm"
                  >
                    {/* Selection only exists to drive the recrawl action, so a
                        reader without it gets a plain list rather than
                        checkboxes wired to a button they never see. */}
                    {canRecrawl && (
                      <Checkbox
                        className="mt-0.5"
                        checked={selectedIds.has(page.id)}
                        onCheckedChange={(checked) => toggle(page.id, checked === true)}
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium break-all">{page.url}</p>
                      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span>
                          {format(t.knowledge.pages.lastChangedLabel, {
                            when: formatRelativeTime(
                              page.content_changed_at,
                              t.knowledge.pages.neverChanged
                            ),
                          })}
                        </span>
                        {page.http_status !== null && (
                          <StatusBadge
                            label={format(t.knowledge.pages.httpStatusLabel, {
                              status: page.http_status,
                            })}
                            tone={isFailedStatus ? 'danger' : 'success'}
                          />
                        )}
                        <StatusBadge
                          label={t.knowledge.pages.pageStatus[page.status]}
                          tone={PAGE_STATUS_TONES[page.status]}
                        />
                      </div>
                      {page.status === 'failed' && page.error_message && (
                        <p className="text-destructive text-xs">{page.error_message}</p>
                      )}
                      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {canRecrawl && (
          <SheetFooter>
            <p className="text-muted-foreground text-sm">
              {format(t.knowledge.pages.selectedCount, { count: selectedIds.size })}
            </p>
            <Button
              type="button"
              className="w-full"
              disabled={selectedIds.size === 0 || isRecrawling}
              onClick={() => recrawlSelected(Array.from(selectedIds))}
            >
              {t.knowledge.actions.recrawlSelected}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
