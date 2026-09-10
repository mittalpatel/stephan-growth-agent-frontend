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
import { format, formatRelativeTime } from '@/lib/i18n';
import { t } from '@/locales';
import type { KnowledgeSourceListItem } from '@/types/knowledge';

import { useKnowledgeSourcePages } from '../hooks/useKnowledgeSourcePages';

type Props = Readonly<{
  source: KnowledgeSourceListItem | null;
  onOpenChange: (open: boolean) => void;
}>;

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

          {!isLoading && !isError && pages.length > 0 && (
            <div className="space-y-1">
              {pages.map((page) => {
                const isFailedStatus = (page.http_status ?? 200) >= 400;
                return (
                  <div
                    key={page.id}
                    className="hover:bg-accent flex items-start gap-2 rounded-md px-2 py-2 text-sm"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={selectedIds.has(page.id)}
                      onCheckedChange={(checked) => toggle(page.id, checked === true)}
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate font-medium">{page.url}</p>
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
      </SheetContent>
    </Sheet>
  );
}
