'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Globe, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RHFRadioCardField, RHFStringListField, RHFTextField } from '@/components/common/form';
import { EmptyState } from '@/components/common/EmptyState';
import { format, formatDuration, formatNumber } from '@/lib/i18n';
import { progressLine } from '@/lib/knowledgeProgress';
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds';
import {
  websiteDiscoverSchema,
  type WebsiteDiscoverFormValues,
  type WebsiteDiscoverSubmitValues,
} from '@/lib/schemas/knowledge';
import { t } from '@/locales';
import type { KnowledgeSourceListItem } from '@/types/knowledge';

import { useAddWebsiteFlow } from '../hooks/useAddWebsiteFlow';
import { useAllKnowledgeSources } from '../hooks/useAllKnowledgeSources';
import { useCrawlJob } from '../hooks/useCrawlJob';
import { useExtractionProgress } from '../hooks/useExtractionProgress';
import { useReadOutcome } from '../hooks/useReadOutcome';

import { DiscoveredUrlsReview } from './DiscoveredUrlsReview';

type Props = Readonly<{
  agentId: string;
  /** Only needed to build the link to an already-existing duplicate source. */
  agentTypeSlug: string;
  onCreated?: (sourceId: string) => void;
}>;

/**
 * The waiting screen for a discovery or extraction run.
 *
 * A bare spinner was the single biggest source of confusion here: discovery
 * on a site without a usable sitemap falls back to a link-by-link crawl that
 * legitimately runs for minutes, and with no elapsed time, no expectation of
 * how long is normal, and no statement that closing is safe, a working run is
 * indistinguishable from a hung one. `progress` is passed only for extraction,
 * where a real fraction is derivable (see `useExtractionProgress`).
 */
function CrawlProgress({
  agentId,
  jobId,
  onFinished,
  title,
  description,
  elapsedTemplate,
  backgroundNotice,
  progress,
}: Readonly<{
  agentId: string;
  jobId: string;
  onFinished: (job: NonNullable<ReturnType<typeof useCrawlJob>['job']>) => void;
  title: string;
  description: string;
  elapsedTemplate: string;
  backgroundNotice: string;
  progress?: { done: number; total: number };
}>) {
  const { job, isActive } = useCrawlJob(agentId, jobId);
  const elapsedSeconds = useElapsedSeconds(job?.created_at ?? null, isActive);

  useEffect(() => {
    if (job && !isActive) onFinished(job);
  }, [job, isActive, onFinished]);

  const showProgress = progress !== undefined && progress.total > 0;

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Loader2 className="text-muted-foreground size-8 animate-spin" aria-hidden />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>

      {showProgress && (
        <div className="w-full max-w-xs" aria-live="polite">
          <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-[width] duration-500"
              style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            {format(t.knowledge.addWebsite.extracting.progress, {
              done: progress.done,
              total: progress.total,
            })}
          </p>
        </div>
      )}

      {job && (
        <p className="text-muted-foreground text-xs tabular-nums" aria-live="off">
          {format(elapsedTemplate, { duration: formatDuration(elapsedSeconds) })}
        </p>
      )}

      <p className="text-muted-foreground max-w-sm text-xs">{backgroundNotice}</p>
    </div>
  );
}

/**
 * The "Read the whole website" waiting screen. There is no crawl job to poll
 * here (the backend starts extraction itself), so it watches the source row
 * on the org-wide list, which the app-wide progress bar keeps polling while
 * anything is in progress. Closing is always safe: nothing waits on the user.
 */
function ReadingProgress({
  source,
  onUpdate,
  onClose,
}: Readonly<{
  source: KnowledgeSourceListItem | undefined;
  onUpdate: (source: KnowledgeSourceListItem) => void;
  onClose: () => void;
}>) {
  const copy = t.knowledge.addWebsite.reading;

  useEffect(() => {
    if (source) onUpdate(source);
  }, [source, onUpdate]);

  const line = progressLine(source?.progress, 'finding');

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <Loader2 className="text-muted-foreground size-8 animate-spin" aria-hidden />
      <p className="font-medium">{copy.title}</p>

      <div className="w-full max-w-xs" aria-live="polite">
        <p className="text-sm tabular-nums">{line.text}</p>
        {line.percent !== null && (
          <div className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-[width] duration-500"
              style={{ width: `${line.percent}%` }}
            />
          </div>
        )}
      </div>

      <p className="text-muted-foreground max-w-sm text-xs">{copy.backgroundNotice}</p>
      <Button variant="outline" onClick={onClose}>
        {copy.close}
      </Button>
    </div>
  );
}

/**
 * What the extraction actually produced, from the finished job's own counters.
 *
 * The done step used to say only "the selected pages have been queued for
 * indexing" — no numbers at all, so an operator had no way to tell whether 3
 * pages or 300 had made it in, or that any had failed, and nothing pointed at
 * where to look afterwards. `excluded_count` covers pages the extractor
 * deliberately skipped (too little content, or duplicate text), which is why
 * it is worded as skipped rather than failed.
 */
function ExtractionSummary({
  websiteSourceId,
  pagesHref,
  onClose,
}: Readonly<{ websiteSourceId: string | null; pagesHref: string | null; onClose: () => void }>) {
  const copy = t.knowledge.addWebsite.done;
  const outcome = useReadOutcome(websiteSourceId);
  const rows = [
    { key: 'indexed', label: copy.indexedLabel, value: outcome.indexed },
    { key: 'failed', label: copy.failedLabel, value: outcome.failedCount },
    { key: 'skipped', label: copy.skippedLabel, value: outcome.skipped },
  ].filter((row) => row.value > 0);

  return (
    <div className="space-y-4 py-4">
      <div className="text-center">
        <CheckCircle2 className="text-success-foreground mx-auto size-8" aria-hidden />
        <p className="mt-2 font-medium">{copy.title}</p>
        <p className="text-muted-foreground mt-1 text-sm">{copy.description}</p>
      </div>

      {rows.length > 0 && (
        <dl className="divide-y rounded-md border">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between px-3 py-2 text-sm">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium tabular-nums">{formatNumber(row.value)}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* A count alone ("1 page could not be read") left testers unsure
          whether their content was missing (client testing, 13 Oct 2026):
          name the pages and say why, in words a site owner can act on. */}
      {outcome.failures.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{copy.failedListTitle}</p>
          <ul className="space-y-2">
            {outcome.failures.map((failure) => (
              <li key={failure.id} className="rounded-md border px-3 py-2 text-xs">
                <p className="truncate font-medium" title={failure.url}>
                  {failure.url}
                </p>
                <p className="text-muted-foreground mt-0.5">{failure.reason}</p>
              </li>
            ))}
          </ul>
          {outcome.hiddenFailures > 0 && (
            <p className="text-muted-foreground text-xs">
              {format(copy.moreFailed, { count: outcome.hiddenFailures })}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {pagesHref && (
          <Button variant="outline" className="sm:flex-1" asChild>
            <Link href={pagesHref}>{copy.reviewPages}</Link>
          </Button>
        )}
        <Button className="sm:flex-1" onClick={onClose}>
          {copy.close}
        </Button>
      </div>
    </div>
  );
}

/**
 * The add-website flow: discover -> poll -> review -> extract -> poll ->
 * done. `useAddWebsiteFlow` owns the step machine; this component renders
 * whichever step is active and feeds job-completion callbacks back in.
 */
export function AddWebsiteDialog({ agentId, agentTypeSlug, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [confirmingReview, setConfirmingReview] = useState(false);
  const flow = useAddWebsiteFlow(agentId, onCreated);

  // A close asked for mid-run can outlive the run: discovery finishing under
  // an open "finish in the background" question lands on the review step. The
  // question then has to become the review one, not stay stale on top of it.
  const reviewQuestionOpen = confirmingReview || (confirmingClose && flow.step === 'review');
  const runningQuestionOpen = confirmingClose && flow.step !== 'review';
  const dismissQuestions = () => {
    setConfirmingClose(false);
    setConfirmingReview(false);
  };
  const isRunning = flow.step === 'discovering' || flow.step === 'extracting';
  // `duplicateSourceId` is a `KnowledgeSource.id`, but the pages route is keyed
  // on `WebsiteSource.id`. The org-wide list already carries both, so the
  // mapping is a lookup against data that is loaded anyway, not a new request.
  const { sources } = useAllKnowledgeSources();
  const createdSource = flow.sourceId
    ? sources.find((source) => source.id === flow.sourceId)
    : undefined;
  const selectedCount = createdSource?.progress?.pages_total ?? null;
  const duplicateWebsiteSourceId = flow.duplicateSourceId
    ? (sources.find((source) => source.id === flow.duplicateSourceId)?.website_source_id ?? null)
    : null;
  const duplicateSourceHref = duplicateWebsiteSourceId
    ? `/agents/${agentTypeSlug}/knowledge/${duplicateWebsiteSourceId}`
    : null;
  const extractionProgress = useExtractionProgress(
    flow.websiteSourceId,
    flow.step === 'extracting'
  );

  const form = useForm<WebsiteDiscoverFormValues, unknown, WebsiteDiscoverSubmitValues>({
    resolver: zodResolver(websiteDiscoverSchema),
    defaultValues: {
      read_mode: 'all',
      root_url: '',
      max_pages: '',
      max_depth: '',
      include_paths: [],
      exclude_paths: [],
    },
  });

  const submit = form.handleSubmit(async (values) => {
    await flow.discover(values, form.setError);
  });

  const close = (next: boolean) => {
    setOpen(next);
    if (!next) {
      flow.reset();
      form.reset();
    }
  };

  /**
   * Closing mid-run throws away every id the flow is holding, and the review
   * step is only reachable from inside this dialog — so an accidental dismiss
   * during a ten-minute discovery silently strands a source that is still
   * being crawled. The run itself is safe (it finishes server-side, and the
   * source is already saved), so this confirms rather than blocks.
   */
  const requestClose = (next: boolean) => {
    if (!next && isRunning) {
      setConfirmingClose(true);
      return;
    }
    // Closing on the review step used to leave the source waiting, `pending`,
    // with nothing on screen saying the user still had to choose (client
    // testing, 06 Oct 2026). Ask instead: read now, or choose later from the
    // knowledge list, which then shows a "Choose pages" button.
    if (!next && flow.step === 'review') {
      setConfirmingReview(true);
      return;
    }
    close(next);
  };

  return (
    <Dialog open={open} onOpenChange={requestClose}>
      <DialogTrigger asChild>
        <Button>
          <Globe className="size-4" aria-hidden />
          {t.knowledge.actions.addWebsite}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          {/* Step-aware: the header read "Add a website" through all six
              steps, so the review step never actually said what it was asking
              for. */}
          <DialogTitle>
            {flow.step === 'review'
              ? t.knowledge.addWebsite.review.title
              : t.knowledge.addWebsite.title}
          </DialogTitle>
        </DialogHeader>

        {flow.step === 'form' && (
          <>
            <p className="text-muted-foreground text-sm">{t.knowledge.addWebsite.description}</p>
            <FormProvider {...form}>
              <form onSubmit={submit} className="space-y-4">
                <RHFTextField<WebsiteDiscoverFormValues>
                  name="root_url"
                  label={t.knowledge.addWebsite.rootUrlLabel}
                  placeholder={t.knowledge.addWebsite.rootUrlPlaceholder}
                  required
                />

                <RHFRadioCardField<WebsiteDiscoverFormValues>
                  name="read_mode"
                  label={t.knowledge.addWebsite.readMode.label}
                  options={[
                    {
                      value: 'all',
                      label: t.knowledge.addWebsite.readMode.allLabel,
                      description: t.knowledge.addWebsite.readMode.allDescription,
                      badge: t.knowledge.addWebsite.readMode.allBadge,
                    },
                    {
                      value: 'choose',
                      label: t.knowledge.addWebsite.readMode.chooseLabel,
                      description: t.knowledge.addWebsite.readMode.chooseDescription,
                    },
                  ]}
                />

                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="-ml-2">
                      {t.knowledge.addWebsite.scope.toggle}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <RHFTextField<WebsiteDiscoverFormValues>
                      name="max_pages"
                      type="number"
                      label={t.knowledge.addWebsite.scope.maxPagesLabel}
                      description={t.knowledge.addWebsite.scope.maxPagesDescription}
                      placeholder={t.knowledge.addWebsite.scope.maxPagesPlaceholder}
                    />
                    <RHFTextField<WebsiteDiscoverFormValues>
                      name="max_depth"
                      type="number"
                      label={t.knowledge.addWebsite.scope.maxDepthLabel}
                      description={t.knowledge.addWebsite.scope.maxDepthDescription}
                      placeholder={t.knowledge.addWebsite.scope.maxDepthPlaceholder}
                    />
                    <RHFStringListField<WebsiteDiscoverFormValues>
                      name="include_paths"
                      label={t.knowledge.addWebsite.scope.includePathsLabel}
                      description={t.knowledge.addWebsite.scope.includePathsDescription}
                      addLabel={t.knowledge.addWebsite.scope.addPath}
                      removeLabel={t.knowledge.addWebsite.scope.removePath}
                      itemPlaceholder={t.knowledge.addWebsite.scope.pathPlaceholder}
                      maxItems={20}
                    />
                    <RHFStringListField<WebsiteDiscoverFormValues>
                      name="exclude_paths"
                      label={t.knowledge.addWebsite.scope.excludePathsLabel}
                      description={t.knowledge.addWebsite.scope.excludePathsDescription}
                      addLabel={t.knowledge.addWebsite.scope.addPath}
                      removeLabel={t.knowledge.addWebsite.scope.removePath}
                      itemPlaceholder={t.knowledge.addWebsite.scope.pathPlaceholder}
                      maxItems={20}
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* The 409's own message already says the site is added; this
                    is the part a toast cannot do, which is take the operator
                    to it. Rendered only when the id resolves to a website
                    source this org can actually open. */}
                {duplicateSourceHref && (
                  <p className="text-muted-foreground text-sm">
                    <Link
                      href={duplicateSourceHref}
                      className="text-primary underline underline-offset-2 hover:no-underline"
                    >
                      {t.knowledge.addWebsite.viewExistingSource}
                    </Link>
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={flow.isDiscovering}>
                  {t.knowledge.addWebsite.submit}
                </Button>
              </form>
            </FormProvider>
          </>
        )}

        {flow.step === 'discovering' && flow.discoverJobId && (
          <CrawlProgress
            agentId={agentId}
            jobId={flow.discoverJobId}
            onFinished={flow.onDiscoveryFinished}
            title={t.knowledge.addWebsite.discovering.title}
            description={t.knowledge.addWebsite.discovering.description}
            elapsedTemplate={t.knowledge.addWebsite.discovering.elapsed}
            backgroundNotice={t.knowledge.addWebsite.discovering.backgroundNotice}
          />
        )}

        {flow.step === 'reading' && (
          <ReadingProgress
            source={createdSource}
            onUpdate={flow.onReadingUpdate}
            onClose={() => close(false)}
          />
        )}

        {flow.step === 'discovery-failed' && (
          <EmptyState
            title={t.knowledge.addWebsite.discoveryFailed.title}
            description={flow.errorSummary || t.knowledge.addWebsite.discoveryFailed.description}
            action={
              <Button variant="outline" onClick={() => close(false)}>
                {t.knowledge.addWebsite.close}
              </Button>
            }
          />
        )}

        {flow.step === 'review' && flow.websiteSourceId && (
          <DiscoveredUrlsReview
            websiteSourceId={flow.websiteSourceId}
            onExtract={() => void flow.extract()}
            isExtracting={flow.isExtracting}
          />
        )}

        {flow.step === 'extracting' && flow.extractJobId && (
          <CrawlProgress
            agentId={agentId}
            jobId={flow.extractJobId}
            onFinished={flow.onExtractionFinished}
            title={t.knowledge.addWebsite.extracting.title}
            description={t.knowledge.addWebsite.extracting.description}
            elapsedTemplate={t.knowledge.addWebsite.extracting.elapsed}
            backgroundNotice={t.knowledge.addWebsite.extracting.backgroundNotice}
            progress={extractionProgress}
          />
        )}

        {flow.step === 'extraction-failed' && (
          <EmptyState
            title={t.knowledge.addWebsite.extractionFailed.title}
            description={flow.errorSummary || t.knowledge.addWebsite.extractionFailed.description}
            action={
              <Button variant="outline" onClick={() => close(false)}>
                {t.knowledge.addWebsite.close}
              </Button>
            }
          />
        )}

        {flow.step === 'done' && (
          <ExtractionSummary
            websiteSourceId={flow.websiteSourceId}
            pagesHref={
              flow.websiteSourceId
                ? `/agents/${agentTypeSlug}/knowledge/${flow.websiteSourceId}`
                : null
            }
            onClose={() => close(false)}
          />
        )}

        <AlertDialog open={reviewQuestionOpen} onOpenChange={(next) => !next && dismissQuestions()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedCount
                  ? format(t.knowledge.addWebsite.closeReview.title, { count: selectedCount })
                  : t.knowledge.addWebsite.closeReview.titleNoCount}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t.knowledge.addWebsite.closeReview.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  dismissQuestions();
                  close(false);
                }}
              >
                {t.knowledge.addWebsite.closeReview.later}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  dismissQuestions();
                  // Reading carries on server-side and the app-wide progress
                  // bar shows it, so the dialog can close straight away.
                  if (await flow.extract()) close(false);
                }}
              >
                {t.knowledge.addWebsite.closeReview.readAll}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={runningQuestionOpen} onOpenChange={setConfirmingClose}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.knowledge.addWebsite.closeWhileRunning.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {t.knowledge.addWebsite.closeWhileRunning.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t.knowledge.addWebsite.closeWhileRunning.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setConfirmingClose(false);
                  close(false);
                }}
              >
                {t.knowledge.addWebsite.closeWhileRunning.confirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
