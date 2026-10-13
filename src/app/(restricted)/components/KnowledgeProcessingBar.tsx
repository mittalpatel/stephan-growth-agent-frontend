'use client';

import { Loader2 } from 'lucide-react';

import { useKnowledgeProcessing } from '@/app/(restricted)/hooks/useKnowledgeProcessing';
import { format } from '@/lib/i18n';
import { t } from '@/locales';

/**
 * A slim notice under the breadcrumb while any knowledge source is still
 * being read, on every restricted page. It renders nothing otherwise, so it
 * costs no layout space in the normal case. See `useKnowledgeProcessing`.
 */
export function KnowledgeProcessingBar() {
  const { inProgress } = useKnowledgeProcessing();
  if (inProgress.length === 0) return null;

  const message =
    inProgress.length === 1
      ? format(t.knowledge.processing.one, { name: inProgress[0].display_name })
      : format(t.knowledge.processing.many, { count: inProgress.length });

  return (
    <div
      role="status"
      className="bg-info text-info-foreground border-border flex items-center gap-2 border-b px-4 py-2 text-sm"
    >
      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
