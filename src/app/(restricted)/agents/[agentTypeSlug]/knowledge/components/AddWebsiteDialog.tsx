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
import { RHFStringListField, RHFTextField } from '@/components/common/form';
import { EmptyState } from '@/components/common/EmptyState';
import { format } from '@/lib/i18n';
import {
  websiteDiscoverSchema,
  type WebsiteDiscoverFormValues,
  type WebsiteDiscoverSubmitValues,
} from '@/lib/schemas/knowledge';
import { t } from '@/locales';

import { useAddWebsiteFlow } from '../hooks/useAddWebsiteFlow';
import { useCrawlJob } from '../hooks/useCrawlJob';
import { useDiscoveredUrls } from '../hooks/useDiscoveredUrls';

type Props = Readonly<{ agentId: string; onCreated?: (sourceId: string) => void }>;

function CrawlProgress({
  agentId,
  jobId,
  onFinished,
  title,
  description,
}: Readonly<{
  agentId: string;
  jobId: string;
  onFinished: (job: NonNullable<ReturnType<typeof useCrawlJob>['job']>) => void;
  title: string;
  description: string;
}>) {
  const { job, isActive } = useCrawlJob(agentId, jobId);

  useEffect(() => {
    if (job && !isActive) onFinished(job);
  }, [job, isActive, onFinished]);

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Loader2 className="text-muted-foreground size-8 animate-spin" aria-hidden />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
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

          <p className="text-muted-foreground text-sm">
            {format(t.knowledge.addWebsite.review.selectedCount, { count: selectedCount })}
          </p>

          <Button
            type="button"
            className="w-full"
            disabled={selectedCount === 0 || isExtracting}
            onClick={onExtract}
          >
            {t.knowledge.addWebsite.review.extract}
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
  const flow = useAddWebsiteFlow(agentId, onCreated);

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

  return (
    <Dialog open={open} onOpenChange={close}>
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
          />
        )}

        {flow.step === 'discovery-failed' && (
          <EmptyState
            title={t.knowledge.addWebsite.discoveryFailed.title}
            description={t.knowledge.addWebsite.discoveryFailed.description}
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
          />
        )}

        {flow.step === 'extraction-failed' && (
          <EmptyState
            title={t.knowledge.addWebsite.extractionFailed.title}
            description={t.knowledge.addWebsite.extractionFailed.description}
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
      </DialogContent>
    </Dialog>
  );
}
