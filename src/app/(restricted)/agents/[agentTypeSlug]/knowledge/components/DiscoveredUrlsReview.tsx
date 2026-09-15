'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Copy, Globe, Plus, Search, Trash2, X } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { RHFTextField } from '@/components/common/form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, plural } from '@/lib/i18n';
import { discoveredUrlAddSchema, type DiscoveredUrlAddFormValues } from '@/lib/schemas/knowledge';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import {
  useDiscoveredUrlsReview,
  type ReviewFilter,
  type ReviewRow,
} from '../hooks/useDiscoveredUrlsReview';

const copy = t.knowledge.addWebsite.review;

/** Past this, extraction runs long enough that silence reads as a hang. */
const SLOW_EXTRACTION_PAGE_COUNT = 25;

type Props = Readonly<{
  websiteSourceId: string;
  onExtract: () => void;
  isExtracting: boolean;
}>;

function ReviewSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-8 w-72" />
      <div className="divide-y rounded-lg border">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function AddUrlForm({
  onAdd,
  defaultOpen = false,
}: Readonly<{ onAdd: (url: string) => Promise<boolean>; defaultOpen?: boolean }>) {
  const [open, setOpen] = useState(defaultOpen);
  const form = useForm<DiscoveredUrlAddFormValues>({
    resolver: zodResolver(discoveredUrlAddSchema),
    defaultValues: { url: '' },
  });

  // A nested <form> would submit the dialog's outer form, so submit by handler.
  const submit = form.handleSubmit(async ({ url }) => {
    if (await onAdd(url)) form.reset();
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground -ml-2">
          <Plus className="size-4" aria-hidden />
          {copy.addUrlToggle}
          <ChevronDown
            className={cn('size-4 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FormProvider {...form}>
          <div
            className="flex items-end gap-2 pt-2"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submit();
              }
            }}
          >
            <div className="min-w-0 flex-1">
              <RHFTextField<DiscoveredUrlAddFormValues>
                name="url"
                label={copy.addUrlLabel}
                type="url"
                placeholder={copy.addUrlPlaceholder}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={form.formState.isSubmitting}
              onClick={() => void submit()}
            >
              {copy.addUrlAction}
            </Button>
          </div>
        </FormProvider>
      </CollapsibleContent>
    </Collapsible>
  );
}

function UrlRow({
  row,
  onToggle,
  onRemove,
}: Readonly<{
  row: ReviewRow;
  onToggle: (selected: boolean) => void;
  onRemove: () => void;
}>) {
  const checkboxId = `discovered-url-${row.id}`;
  return (
    <li
      className={cn(
        'group hover:bg-accent/50 flex items-center gap-3 px-3 py-2 transition-colors',
        !row.is_selected && 'bg-muted/40'
      )}
    >
      <Checkbox
        id={checkboxId}
        checked={row.is_selected}
        onCheckedChange={(checked) => onToggle(checked === true)}
      />
      <label htmlFor={checkboxId} className="min-w-0 flex-1 cursor-pointer py-0.5">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'truncate text-sm',
              !row.is_selected && 'text-muted-foreground',
              row.isHome && 'font-medium'
            )}
            title={row.url}
          >
            {row.isHome ? copy.homePage : row.path}
          </span>
          {row.isDuplicate && (
            <Badge variant="outline" className="shrink-0 text-xs font-normal">
              {copy.duplicate}
            </Badge>
          )}
        </span>
        {(row.foreignOrigin || row.isHome) && (
          <span className="text-muted-foreground block truncate text-xs">
            {row.foreignOrigin ?? row.url}
          </span>
        )}
      </label>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        title={copy.removeUrlHint}
        aria-label={format(copy.removeUrlLabel, { url: row.url })}
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive size-7 shrink-0 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Trash2 className="size-3.5" aria-hidden />
      </Button>
    </li>
  );
}

/**
 * Choose which discovered pages to extract. Ordered the way the decision is
 * made: what was found, narrowing it, the list, then commit. The footer stays
 * pinned so the cost of the action is always in view on a long crawl.
 */
export function DiscoveredUrlsReview({ websiteSourceId, onExtract, isExtracting }: Props) {
  const review = useDiscoveredUrlsReview(websiteSourceId);

  if (review.isLoading) return <ReviewSkeleton />;

  if (review.isError) {
    return (
      <EmptyState
        title={copy.loadError}
        action={
          <Button type="button" variant="outline" onClick={() => void review.refetch()}>
            {t.buttons.tryAgain}
          </Button>
        }
      />
    );
  }

  if (review.total === 0) {
    return (
      <div className="space-y-4">
        <EmptyState icon={Globe} title={copy.noPages} description={copy.noPagesDescription} />
        <AddUrlForm onAdd={review.addUrl} defaultOpen />
      </div>
    );
  }

  const site = review.mainOrigin.replace(/^https?:\/\//, '');
  const allSelected = review.selectedCount === review.total;
  const selectedPercent = Math.round((review.selectedCount / review.total) * 100);

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-semibold tabular-nums">
            {format(copy.selectedCount, { count: review.selectedCount, total: review.total })}
          </p>
          {site && (
            <p className="text-muted-foreground truncate text-xs">
              {format(copy.foundOn, { site })}
            </p>
          )}
        </div>
        <div className="bg-muted h-1 overflow-hidden rounded-full" aria-hidden>
          <div
            className="bg-primary h-full transition-[width] duration-300"
            style={{ width: `${selectedPercent}%` }}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          {allSelected && review.total > 1 ? copy.preselectedNotice : copy.selectionHint}
        </p>
      </div>

      {review.isTruncated && (
        <p className="bg-muted text-muted-foreground rounded-md px-3 py-2 text-xs">
          {format(copy.truncatedNotice, { shown: review.total, total: review.serverTotal })}
        </p>
      )}

      {review.duplicateCount > 0 && (
        <div className="border-border flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <Copy className="size-3.5 shrink-0" aria-hidden />
            {plural(review.duplicateCount, copy.duplicateNotice)}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void review.deselectDuplicates()}
          >
            {copy.deselectDuplicates}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={review.search}
            onChange={(event) => review.setSearch(event.target.value)}
            placeholder={copy.searchPlaceholder}
            aria-label={copy.searchPlaceholder}
            className="pr-9 pl-8"
          />
          {review.search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={copy.clearSearch}
              onClick={() => review.setSearch('')}
              className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
            >
              <X className="size-3.5" aria-hidden />
            </Button>
          )}
        </div>

        <Tabs
          value={review.filter}
          onValueChange={(value) => review.setFilter(value as ReviewFilter)}
        >
          <TabsList aria-label={copy.filters.label} className="w-full">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              {format(copy.filters.all, { count: review.total })}
            </TabsTrigger>
            <TabsTrigger value="selected" className="text-xs sm:text-sm">
              {format(copy.filters.selected, { count: review.selectedCount })}
            </TabsTrigger>
            <TabsTrigger value="unselected" className="text-xs sm:text-sm">
              {format(copy.filters.unselected, { count: review.unselectedCount })}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {review.sections.length > 1 && (
          <div
            role="group"
            aria-label={copy.sectionsLabel}
            className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
          >
            {review.sections.map((section) => {
              const active = review.activeSection === section.segment;
              return (
                <Button
                  key={section.segment}
                  type="button"
                  size="sm"
                  variant={active ? 'secondary' : 'outline'}
                  aria-pressed={active}
                  onClick={() => review.toggleSection(section.segment)}
                  className="h-7 shrink-0 rounded-full px-2.5 text-xs"
                >
                  /{section.segment}
                  <span className="text-muted-foreground tabular-nums">{section.count}</span>
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border">
        {review.visibleRows.length > 0 && (
          <div className="bg-muted/50 flex items-center gap-3 border-b px-3 py-2">
            <Checkbox
              id="discovered-urls-select-shown"
              checked={review.allVisibleSelected}
              onCheckedChange={(checked) => void review.setVisibleSelected(checked === true)}
            />
            <label
              htmlFor="discovered-urls-select-shown"
              className="flex-1 cursor-pointer text-xs font-medium"
            >
              {format(review.isNarrowed ? copy.selectShown : copy.selectAllPages, {
                count: review.visibleRows.length,
              })}
            </label>
            {review.isNarrowed && (
              <span className="text-muted-foreground text-xs tabular-nums">
                {format(copy.filterCount, {
                  shown: review.visibleRows.length,
                  total: review.total,
                })}
              </span>
            )}
          </div>
        )}

        {review.visibleRows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <p className="text-muted-foreground text-sm">{copy.noMatches}</p>
            <Button type="button" variant="outline" size="sm" onClick={review.clearFilters}>
              {copy.clearFilters}
            </Button>
          </div>
        ) : (
          <ul className="max-h-[min(22rem,45vh)] divide-y overflow-y-auto overscroll-contain">
            {review.visibleRows.map((row) => (
              <UrlRow
                key={row.id}
                row={row}
                onToggle={(selected) => void review.toggle(row.id, selected)}
                onRemove={() => void review.removeUrl(row.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <AddUrlForm onAdd={review.addUrl} />

      <div className="bg-popover sticky bottom-0 -mx-4 -mb-4 space-y-2 border-t px-4 py-3">
        {review.selectedCount === 0 ? (
          <p className="text-muted-foreground text-xs">{copy.nothingSelected}</p>
        ) : (
          review.selectedCount > SLOW_EXTRACTION_PAGE_COUNT && (
            <p className="text-muted-foreground text-xs">{copy.slowWarning}</p>
          )
        )}
        <Button
          type="button"
          className="w-full"
          disabled={review.selectedCount === 0 || isExtracting}
          onClick={onExtract}
        >
          {review.selectedCount > 0
            ? plural(review.selectedCount, copy.extractCount)
            : copy.extract}
        </Button>
      </div>
    </div>
  );
}
