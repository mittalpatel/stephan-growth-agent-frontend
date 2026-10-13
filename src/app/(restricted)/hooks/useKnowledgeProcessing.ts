'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useAgentOptions } from '@/app/(restricted)/hooks/useAgentOptions';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { format } from '@/lib/i18n';
import { t } from '@/locales';
import {
  KNOWLEDGE_SOURCES_ENDPOINT,
  KNOWLEDGE_SOURCES_LIST_KEY,
  KNOWLEDGE_TARGET_PICKER_PAGE_SIZE,
} from '@/services/knowledge';
import type { ApiResponse } from '@/types/api';
import type { KnowledgeSourceListItem, KnowledgeSourceStatus } from '@/types/knowledge';

const POLL_INTERVAL_MS = 4_000;
const IN_PROGRESS: readonly KnowledgeSourceStatus[] = ['pending', 'processing'];

/**
 * Org-wide "is any knowledge still being read?" for the app shell.
 *
 * Client testing (06 Oct 2026): after adding a website the user could close
 * the dialog and keep working, but nothing anywhere said the crawl was still
 * running, so the unticked "Add knowledge" step looked like a bug. This reads
 * the same org-wide list as `useAllKnowledgeSources` (same query key, so the
 * cache is shared and an add-source invalidation wakes it up), polls only
 * while something is in progress, and toasts each source as it finishes.
 * Each row's `progress` (backend 2026-10-13) carries its stage and live page
 * counts, so nothing here has to guess what a `pending` source is doing.
 */
export function useKnowledgeProcessing() {
  const { can } = usePermissions();
  const canView = can('knowledge', 'view');

  const query = useAuthQuery<ApiResponse<KnowledgeSourceListItem[]>>(
    [KNOWLEDGE_SOURCES_LIST_KEY, 'all'],
    `${KNOWLEDGE_SOURCES_ENDPOINT}?page=1&page_size=${KNOWLEDGE_TARGET_PICKER_PAGE_SIZE}`,
    {
      enabled: canView,
      refetchInterval: (q) =>
        q.state.data?.data.some((source) => IN_PROGRESS.includes(source.status))
          ? POLL_INTERVAL_MS
          : false,
    }
  );

  const sources = query.data?.data;
  const inProgress = (sources ?? []).filter((source) => IN_PROGRESS.includes(source.status));

  // Ids seen in progress on the previous read. `null` until the first read,
  // so sources that finished before this page loaded never toast.
  const previouslyInProgress = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!sources) return;
    const previous = previouslyInProgress.current;
    if (previous) {
      for (const source of sources) {
        if (!previous.has(source.id) || IN_PROGRESS.includes(source.status)) continue;
        if (source.status === 'ready') {
          toast.success(format(t.knowledge.processing.readyToast, { name: source.display_name }));
        } else if (source.status === 'failed') {
          toast.error(format(t.knowledge.processing.failedToast, { name: source.display_name }));
        }
      }
    }
    previouslyInProgress.current = new Set(
      sources.filter((source) => IN_PROGRESS.includes(source.status)).map((source) => source.id)
    );
  }, [sources]);

  // Knowledge lives on an agent's Knowledge tab, so "View progress" needs an
  // agent to open. Any agent works: sources are shared across the org.
  const { agents } = useAgentOptions();
  const firstAgentSlug = agents[0]?.agent_type?.slug;
  const knowledgeHref = firstAgentSlug ? `/agents/${firstAgentSlug}?tab=knowledge` : null;

  // A website on "choosing" is waiting on the user, not on us. It still
  // belongs in the bar (with its button), but it must not drive the spinner
  // icon: it shows a list icon and a "Choose pages" button instead.
  const running = inProgress.filter((source) => source.progress?.stage !== 'choosing');

  return {
    inProgress,
    isWorking: running.length > 0,
    agentSlug: firstAgentSlug ?? null,
    knowledgeHref,
  };
}
