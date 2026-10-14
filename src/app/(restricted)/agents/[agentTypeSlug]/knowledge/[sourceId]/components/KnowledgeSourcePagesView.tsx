'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ChevronDown, Info, Loader2, Search, Trash2 } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { format, formatNumber, formatRelativeTime } from '@/lib/i18n';
import { progressLine } from '@/lib/knowledgeProgress';
import { pageFailureReason } from '@/lib/pageFailure';
import { t } from '@/locales';
import type { PageStatus } from '@/types/knowledge';

import { useAllKnowledgeSources } from '../../hooks/useAllKnowledgeSources';
import { useKnowledgeSourcePages } from '../../hooks/useKnowledgeSourcePages';

type Props = Readonly<{ agentTypeSlug: string; websiteSourceId: string }>;

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

/** The outcomes whose meaning isn't self-evident from the label. "Not
 * extracted yet" is here because client testing (29 Sep 2026) found even
 * the product owner could not tell what to do about it. */
const PAGE_STATUS_HINTS: Partial<Record<PageStatus, string>> = {
  get discovered() {
    return t.knowledge.pages.pageStatusHint.discovered;
  },
  get low_quality() {
    return t.knowledge.pages.pageStatusHint.low_quality;
  },
  get duplicate() {
    return t.knowledge.pages.pageStatusHint.duplicate;
  },
};

/** Already-indexed pages first (what the request was for), then whatever
 * needs attention next (failed), then deliberate skips, then everything
 * still waiting to be extracted at all. */
const STATUS_SORT_PRIORITY: Record<PageStatus, number> = {
  ready: 0,
  failed: 1,
  low_quality: 2,
  duplicate: 2,
  discovered: 3,
};

/**
 * A website source's page list: crawl health per page (last content change,
 * HTTP status), a search box, a way to add a page manually, and selective
 * recrawl via the backend's 2026-09-09 `recrawl-pages/` endpoint. Its own
 * route (2026-09-11) rather than a side sheet — a real crawl commonly finds
 * hundreds of pages, which a sheet has no room to search or manage well.
 * Distinct from `DiscoveredUrlsReview` in `AddWebsiteDialog.tsx`, which is
 * the one-time, pre-extraction wizard step for a brand-new source.
 */
export function KnowledgeSourcePagesView({ agentTypeSlug, websiteSourceId }: Props) {
  const { can } = usePermissions();
  const canView = can('knowledge', 'view');
  const canManage = can('knowledge', 'manage');
  const canRecrawl = can('knowledge', 'execute');

  // Resolves this source's display name and, while it is being re-read, its
  // live progress: the pages endpoint itself carries no source metadata.
  const { sources } = useAllKnowledgeSources();
  const source = sources.find((item) => item.website_source_id === websiteSourceId);
  const isReading = source?.progress?.stage === 'reading';
  // The app-wide bar leaves this source out on its own screen, so this
  // banner covers every stage, not only reading.
  const progress = source?.progress ?? null;
  const progressText = progress ? progressLine(progress, progress.stage) : null;

  const {
    pages,
    isLoading,
    isError,
    recrawlSelected,
    isRecrawling,
    addUrl,
    setIncluded,
    removePage,
    isTruncated,
    total,
  } = useKnowledgeSourcePages(canView ? websiteSourceId : null, {
    isReading: progress !== null,
  });
  // The trash button deleted on first click, with no undo (client testing,
  // 14 Oct 2026). It now asks, and points at Exclude for keeping the page.
  const [pendingRemove, setPendingRemove] = useState<{ id: string; url: string } | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // The pages last sent to be read. In "choose" mode every page starts
  // selected, so "selected and not read yet" would mark all of them as being
  // read when only the ticked few are. `null` after a reload, where the
  // selected-and-unread rule is the best guess left.
  const [sentIds, setSentIds] = useState<Set<string> | null>(null);
  const [search, setSearch] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const toggle = (pageId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(pageId);
      else next.delete(pageId);
      return next;
    });
  };

  const sortedPages = useMemo(
    () =>
      [...pages].sort((a, b) => STATUS_SORT_PRIORITY[a.status] - STATUS_SORT_PRIORITY[b.status]),
    [pages]
  );

  const query = search.trim().toLowerCase();
  const visiblePages = query
    ? sortedPages.filter((page) => page.url.toLowerCase().includes(query))
    : sortedPages;
  const isFiltered = query.length > 0;
  // Scoped to the filtered rows, so "search, then select all" picks exactly
  // what the search shows (same rule as `KnowledgeTargetsPanel`).
  const allVisibleSelected =
    visiblePages.length > 0 && visiblePages.every((page) => selectedIds.has(page.id));
  const someVisibleSelected = visiblePages.some((page) => selectedIds.has(page.id));
  const toggleAllVisible = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const page of visiblePages) {
        if (checked) next.add(page.id);
        else next.delete(page.id);
      }
      return next;
    });
  };

  // Status counts cover included pages only, so the boxes add up to "Pages
  // found": an excluded page counts once, under Excluded, whatever its status.
  const countByStatus = (status: PageStatus) =>
    pages.filter((page) => page.is_selected && page.status === status).length;
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
    {
      key: 'excluded',
      label: t.knowledge.pages.summary.excluded,
      value: pages.filter((page) => !page.is_selected).length,
    },
  ].filter((row) => row.key === 'total' || row.value > 0);

  const submitNewUrl = () => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    void addUrl(trimmed);
    setNewUrl('');
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/agents/${agentTypeSlug}?tab=knowledge`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t.knowledge.pages.backToKnowledge}
        </Link>
        <h1 className="font-display mt-3 text-2xl font-bold tracking-tight">
          {source?.display_name ?? t.knowledge.pages.title}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {format(t.knowledge.pages.description, { name: source?.display_name ?? '' })}
        </p>
      </div>

      {!canView && (
        <EmptyState
          title={t.knowledge.pages.noPermissionTitle}
          description={t.knowledge.pages.noPermissionDescription}
        />
      )}

      {canView && isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="text-muted-foreground size-6 animate-spin" aria-hidden />
        </div>
      )}

      {canView && !isLoading && isError && (
        <EmptyState
          icon={AlertTriangle}
          title={t.knowledge.pages.errorTitle}
          description={t.knowledge.pages.errorDescription}
        />
      )}

      {canView && !isLoading && !isError && pages.length === 0 && (
        <EmptyState title={t.knowledge.pages.empty} />
      )}

      {canView && !isLoading && !isError && pages.length > 0 && (
        <>
          {/* What the crawl actually produced, counted from the rows already
              loaded. Without this the page answers "which pages exist" but
              not "how did it go", which is the first thing anyone asks after a
              crawl finishes. */}
          {progressText && (
            <div
              role="status"
              className="bg-info text-info-foreground flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
            >
              <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden />
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-semibold tabular-nums">{progressText.text}</p>
                {progressText.percent !== null && (
                  <div className="bg-current/20 h-1.5 w-full max-w-sm overflow-hidden rounded-full">
                    <div
                      className="h-full bg-current transition-[width] duration-500"
                      style={{ width: `${progressText.percent}%` }}
                    />
                  </div>
                )}
                <p className="text-xs opacity-80">{t.knowledge.pages.reading.description}</p>
              </div>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {summaryRows.map((row) => (
              <div key={row.key} className="bg-card rounded-lg border px-4 py-3">
                <dt className="text-muted-foreground text-xs">{row.label}</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">
                  {formatNumber(row.value)}
                </dd>
              </div>
            ))}
          </dl>

          {/* Client testing found the page had no stated purpose: selecting a
              row looked like it should do something, auto-skipped pages were
              unexplained, and there was no hint of what to leave out. */}
          <Collapsible className="bg-card rounded-lg border">
            <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold">
              <span className="inline-flex items-center gap-2">
                <Info className="text-muted-foreground size-4" aria-hidden />
                {t.knowledge.pages.guide.title}
              </span>
              <ChevronDown
                className="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180"
                aria-hidden
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 px-4 pb-4 text-sm">
              <ul className="text-muted-foreground list-disc space-y-1.5 pl-5">
                {t.knowledge.pages.guide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
              <p className="font-medium">{t.knowledge.pages.guide.excludeTitle}</p>
              <ul className="text-muted-foreground list-disc space-y-1.5 pl-5">
                {t.knowledge.pages.guide.excludeExamples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>

          {/* One max-size page is read at a time, so a source larger than that
              would otherwise present a partial list as the whole thing. */}
          {isTruncated && (
            <p className="text-warning-foreground bg-warning rounded-md px-4 py-2.5 text-xs">
              {format(t.knowledge.pages.truncatedNotice, {
                total: formatNumber(total),
                shown: formatNumber(pages.length),
              })}
            </p>
          )}

          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.knowledge.pages.searchPlaceholder}
              aria-label={t.knowledge.pages.searchPlaceholder}
              className="pl-8"
            />
          </div>

          {visiblePages.length === 0 ? (
            <p className="text-muted-foreground rounded-md border py-8 text-center text-sm">
              {format(t.knowledge.pages.noMatches, { query: search.trim() })}
            </p>
          ) : (
            <div className="divide-y rounded-md border">
              {canRecrawl && (
                <label className="bg-muted/40 flex items-center gap-3 px-4 py-2.5 text-sm font-medium">
                  <Checkbox
                    checked={
                      allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false
                    }
                    onCheckedChange={(checked) => toggleAllVisible(checked === true)}
                  />
                  {t.knowledge.pages.selectAllLabel}
                </label>
              )}
              {visiblePages.map((page) => {
                const isFailedStatus = (page.http_status ?? 200) >= 400;
                // The backend's own reason beats a guess from the status.
                const isBeingRead =
                  isReading &&
                  page.status === 'discovered' &&
                  (sentIds ? sentIds.has(page.id) : page.is_selected);
                const hint = page.exclusion_reason
                  ? t.knowledge.pages.exclusionReason[page.exclusion_reason]
                  : isBeingRead || !page.is_selected
                    ? null
                    : PAGE_STATUS_HINTS[page.status];
                return (
                  <div
                    key={page.id}
                    className="hover:bg-accent flex items-start gap-3 px-4 py-3 text-sm"
                  >
                    {canRecrawl && (
                      <Checkbox
                        className="mt-0.5"
                        checked={selectedIds.has(page.id)}
                        onCheckedChange={(checked) => toggle(page.id, checked === true)}
                        aria-label={format(t.knowledge.pages.recrawlRowLabel, { url: page.url })}
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
                        {/* An excluded page shows only "Excluded": its read
                            status beside it ("Not read yet", or a success-toned
                            "Read") said two things at once, and a page left out
                            on purpose needs no reading instructions. */}
                        {isBeingRead ? (
                          <StatusBadge label={t.knowledge.pages.reading.badge} tone="info" />
                        ) : page.is_selected ? (
                          <StatusBadge
                            label={t.knowledge.pages.pageStatus[page.status]}
                            tone={PAGE_STATUS_TONES[page.status]}
                          />
                        ) : (
                          <StatusBadge label={t.knowledge.pages.excludedBadge} tone="warning" />
                        )}
                      </div>
                      {page.status === 'failed' && (
                        <p className="text-destructive text-xs">{pageFailureReason(page)}</p>
                      )}
                      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
                      {!page.is_selected && (
                        <p className="text-muted-foreground text-xs">
                          {t.knowledge.pages.excludedHint}
                        </p>
                      )}
                    </div>
                    {canManage && (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void setIncluded(page.id, !page.is_selected)}
                          title={
                            page.is_selected
                              ? t.knowledge.pages.excludeTitle
                              : t.knowledge.pages.includeTitle
                          }
                        >
                          {page.is_selected
                            ? t.knowledge.pages.excludeAction
                            : t.knowledge.pages.includeAction}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPendingRemove({ id: page.id, url: page.url })}
                          title={t.knowledge.pages.removeTitle}
                          aria-label={format(t.knowledge.pages.removeRowLabel, { url: page.url })}
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isFiltered && visiblePages.length > 0 && (
            <p className="text-muted-foreground text-xs">
              {format(t.knowledge.pages.filterCount, {
                shown: visiblePages.length,
                total: pages.length,
              })}
            </p>
          )}

          {canManage && (
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs">{t.knowledge.pages.addUrlHint}</p>
              <div className="flex items-center gap-2">
                <Input
                  value={newUrl}
                  onChange={(event) => setNewUrl(event.target.value)}
                  placeholder={t.knowledge.pages.addUrlPlaceholder}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      submitNewUrl();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={submitNewUrl}
                  disabled={!newUrl.trim()}
                >
                  {t.knowledge.pages.addUrlAction}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {canView && canRecrawl && pages.length > 0 && (
        <div className="bg-card/95 border-border sticky bottom-4 flex items-center justify-between gap-4 rounded-lg border px-4 py-3 shadow-sm backdrop-blur">
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {format(t.knowledge.pages.selectedCount, { count: selectedIds.size })}
            </p>
            <p className="text-muted-foreground text-xs">{t.knowledge.pages.selectionHint}</p>
          </div>
          <Button
            type="button"
            className="shrink-0"
            disabled={selectedIds.size === 0 || isRecrawling}
            onClick={() =>
              recrawlSelected(Array.from(selectedIds), () => {
                setSentIds(selectedIds);
                setSelectedIds(new Set());
              })
            }
          >
            {t.knowledge.actions.recrawlSelected}
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={pendingRemove !== null}
        title={t.knowledge.pages.removeConfirmTitle}
        message={format(t.knowledge.pages.removeConfirmMessage, { url: pendingRemove?.url ?? '' })}
        confirmLabel={t.knowledge.pages.removeConfirmAction}
        destructive
        onConfirm={() => {
          if (pendingRemove) void removePage(pendingRemove.id);
          setPendingRemove(null);
        }}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null);
        }}
      />
    </div>
  );
}
