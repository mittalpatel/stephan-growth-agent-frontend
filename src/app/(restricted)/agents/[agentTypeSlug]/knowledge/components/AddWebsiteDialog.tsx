'use client';

import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
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
import { RHFStringListField, RHFTextField } from '@/components/common/form';
import { EmptyState } from '@/components/common/EmptyState';
import { format, formatDuration, plural } from '@/lib/i18n';
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds';
import {
  websiteDiscoverSchema,
  type WebsiteDiscoverFormValues,
  type WebsiteDiscoverSubmitValues,
} from '@/lib/schemas/knowledge';
import { t } from '@/locales';

import { useAddWebsiteFlow } from '../hooks/useAddWebsiteFlow';
import { useCrawlJob } from '../hooks/useCrawlJob';
import { useDiscoveredUrls } from '../hooks/useDiscoveredUrls';
import { useExtractionProgress } from '../hooks/useExtractionProgress';

type Props = Readonly<{ agentId: string; onCreated?: (sourceId: string) => void }>;

/**
 * Above this, extraction is slow enough to be worth warning about up front —
 * each page is a separate fetch plus an embedding call, so a full-site
 * selection routinely runs for minutes. Not a backend limit, just the point
 * where silence starts reading as a hang.
 */
const SLOW_EXTRACTION_PAGE_COUNT = 25;

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

function DiscoveredUrlsReview({
  websiteSourceId,
  onExtract,
  isExtracting,
}: Readonly<{
  websiteSourceId: string;
  onExtract: () => void;
  isExtracting: boolean;
}>) {
  const { urls, isLoading, selectedCount, toggle, selectAll, deselectAll, addUrl, removeUrl } =
    useDiscoveredUrls(websiteSourceId);
  const [newUrl, setNewUrl] = useState('');

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="text-muted-foreground size-6 animate-spin" aria-hidden />
      </div>
    );
  }

  const submitNewUrl = () => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    void addUrl(trimmed);
    setNewUrl('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          value={newUrl}
          onChange={(event) => setNewUrl(event.target.value)}
          placeholder={t.knowledge.addWebsite.review.addUrlPlaceholder}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submitNewUrl();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={submitNewUrl} disabled={!newUrl.trim()}>
          {t.knowledge.addWebsite.review.addUrlAction}
        </Button>
      </div>

      {urls.length === 0 ? (
        <EmptyState title={t.knowledge.addWebsite.review.noPages} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {format(t.knowledge.addWebsite.review.description, { count: urls.length })}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => void selectAll()}>
                {t.knowledge.addWebsite.review.selectAll}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => void deselectAll()}>
                {t.knowledge.addWebsite.review.deselectAll}
              </Button>
            </div>
          </div>

          {/* Every discovered page arrives `is_selected: true` from the
              backend, which reads as "nothing is selected yet" to anyone who
              expects an opt-in list — the reported symptom was checking one
              box and being surprised that extraction processed the whole
              site. The count moves above the list too, so what is about to
              be extracted is visible without scrolling past every URL. */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-sm font-medium tabular-nums">
              {format(t.knowledge.addWebsite.review.selectedCount, {
                count: selectedCount,
                total: urls.length,
              })}
            </p>
            {selectedCount === urls.length && urls.length > 1 && (
              <p className="text-muted-foreground text-xs">
                {t.knowledge.addWebsite.review.preselectedNotice}
              </p>
            )}
          </div>

          <div className="max-h-112 space-y-1 overflow-y-auto rounded-md border p-2">
            {urls.map((url) => (
              <div
                key={url.id}
                className="hover:bg-accent flex items-start gap-2 rounded-md px-2 py-1.5 text-sm"
              >
                <label className="flex min-w-0 flex-1 items-start gap-2">
                  <Checkbox
                    className="mt-0.5"
                    checked={url.is_selected}
                    onCheckedChange={(checked) => void toggle(url.id, checked === true)}
                  />
                  <span className="min-w-0 break-all">{url.url}</span>
                </label>
                <button
                  type="button"
                  aria-label={t.knowledge.addWebsite.review.removeUrl}
                  onClick={() => void removeUrl(url.id)}
                  className="text-muted-foreground hover:text-destructive mt-0.5 shrink-0 rounded p-1"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
            ))}
          </div>

          {selectedCount > SLOW_EXTRACTION_PAGE_COUNT && (
            <p className="text-muted-foreground text-sm">
              {format(t.knowledge.addWebsite.review.slowWarning, { count: selectedCount })}
            </p>
          )}

          {/* The count lives on the button itself so the cost of the action is
              stated at the moment of committing to it, not just above the list. */}
          <Button
            type="button"
            className="w-full"
            disabled={selectedCount === 0 || isExtracting}
            onClick={onExtract}
          >
            {selectedCount > 0
              ? plural(selectedCount, t.knowledge.addWebsite.review.extractCount)
              : t.knowledge.addWebsite.review.extract}
          </Button>
        </>
      )}
    </div>
  );
}

/**
 * The add-website flow: discover -> poll -> review -> extract -> poll ->
 * done. `useAddWebsiteFlow` owns the step machine; this component renders
 * whichever step is active and feeds job-completion callbacks back in.
 */
export function AddWebsiteDialog({ agentId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const flow = useAddWebsiteFlow(agentId, onCreated);
  const isRunning = flow.step === 'discovering' || flow.step === 'extracting';
  const extractionProgress = useExtractionProgress(
    flow.websiteSourceId,
    flow.step === 'extracting'
  );

  const form = useForm<WebsiteDiscoverFormValues, unknown, WebsiteDiscoverSubmitValues>({
    resolver: zodResolver(websiteDiscoverSchema),
    defaultValues: {
      root_url: '',
      max_pages: '',
      max_depth: '',
      include_paths: [],
      exclude_paths: [],
    },
  });

  const submit = form.handleSubmit(async (values) => {
    await flow.discover(values);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.knowledge.addWebsite.title}</DialogTitle>
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
          <EmptyState
            title={t.knowledge.addWebsite.done.title}
            description={t.knowledge.addWebsite.done.description}
            action={
              <Button onClick={() => close(false)}>{t.knowledge.addWebsite.done.close}</Button>
            }
          />
        )}

        <AlertDialog open={confirmingClose} onOpenChange={setConfirmingClose}>
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
