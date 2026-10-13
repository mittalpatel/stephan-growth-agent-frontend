'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ListChecks, Loader2 } from 'lucide-react';

import { useKnowledgeProcessing } from '@/app/(restricted)/hooks/useKnowledgeProcessing';
import { Button } from '@/components/ui/button';
import { format } from '@/lib/i18n';
import { progressLine, siteName } from '@/lib/knowledgeProgress';
import { t } from '@/locales';
import type { KnowledgeSourceListItem, SourceProgressStage } from '@/types/knowledge';

const copy = t.knowledge.processing;

/** Sources listed by name before the rest collapse into "N more". */
const MAX_LISTED = 3;

/** The backend's stage, or a status-only fallback for a row without one. */
function currentStage(source: KnowledgeSourceListItem): SourceProgressStage {
  if (source.progress) return source.progress.stage;
  if (source.status === 'processing') return 'reading';
  return source.source_type === 'website' ? 'finding' : 'waiting';
}

/**
 * A notice under the breadcrumb while any knowledge source is still being
 * read, on every restricted page. It renders nothing otherwise.
 *
 * One row per source, each a single sentence ("Reading pages: 8 of 50")
 * with a fill bar while reading and one action: "Choose pages" when the site
 * waits on the user, "Open" otherwise. Client review (13 Oct 2026) found the
 * earlier step trail, elapsed clock and separate "View progress" link too
 * busy to read at a glance. A source's own pages screen shows its progress
 * in place, so its row is left out there rather than shown twice.
 */
export function KnowledgeProcessingBar() {
  const { inProgress, isWorking, agentSlug, knowledgeHref } = useKnowledgeProcessing();
  const pathname = usePathname();
  const shown = inProgress.filter(
    (source) => !source.website_source_id || !pathname.endsWith(`/${source.website_source_id}`)
  );
  if (shown.length === 0) return null;

  const listed = shown.slice(0, MAX_LISTED);
  const hidden = shown.length - listed.length;

  return (
    <div role="status" className="bg-info text-info-foreground border-border border-b px-4 py-2.5">
      <ul className="mx-auto w-full max-w-[1400px] space-y-2">
        {listed.map((source) => {
          const stage = currentStage(source);
          const line = progressLine(source.progress, stage);
          const choosing = stage === 'choosing';
          const href =
            agentSlug && source.website_source_id
              ? `/agents/${agentSlug}/knowledge/${source.website_source_id}`
              : knowledgeHref;
          return (
            <li key={source.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
              {choosing ? (
                <ListChecks className="size-4 shrink-0" aria-hidden />
              ) : (
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              )}
              <span className="max-w-60 truncate font-semibold" title={source.display_name}>
                {siteName(source.display_name)}
              </span>
              <span className="tabular-nums">{line.text}</span>
              {line.percent !== null && (
                <span className="flex items-center gap-2">
                  <span className="bg-current/20 h-1.5 w-28 overflow-hidden rounded-full sm:w-40">
                    <span
                      className="block h-full bg-current transition-[width] duration-500"
                      style={{ width: `${line.percent}%` }}
                    />
                  </span>
                  <span className="text-xs tabular-nums opacity-80">{line.percent}%</span>
                </span>
              )}
              {href && (
                <span className="ml-auto">
                  {choosing ? (
                    <Button asChild size="sm">
                      <Link href={href}>{copy.choosePages}</Link>
                    </Button>
                  ) : (
                    <Link href={href} className="font-semibold underline-offset-4 hover:underline">
                      {copy.openSource}
                    </Link>
                  )}
                </span>
              )}
            </li>
          );
        })}
        {hidden > 0 && (
          <li className="pl-7 text-xs opacity-80">{format(copy.more, { count: hidden })}</li>
        )}
        {isWorking && <li className="pl-7 text-xs opacity-80">{copy.hint}</li>}
      </ul>
    </div>
  );
}
