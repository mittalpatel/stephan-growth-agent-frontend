import type { Metadata } from 'next';
import { Suspense } from 'react';

import { t } from '@/locales';

import { KnowledgeSourcePagesSkeleton } from './components/KnowledgeSourcePagesSkeleton';
import { KnowledgeSourcePagesView } from './components/KnowledgeSourcePagesView';

export const metadata: Metadata = { title: t.knowledge.pages.title };

/**
 * A website source's page list, as its own route rather than the
 * `KnowledgeSourcePagesPanel` side sheet it replaced (2026-09-11) — a sheet
 * cramped search, manual add, and a 250+ row list into a fraction of the
 * screen. `sourceId` here is the `WebsiteSource.id` (what
 * `KnowledgeSourceListItem.website_source_id` carries, and what every
 * pages-scoped backend route is keyed on), not the parent `KnowledgeSource.id`.
 *
 * `params` is a Promise in Next 16 — see `AGENTS.md`'s note on why it must be
 * awaited rather than destructured.
 */
export default async function KnowledgeSourcePagesPage({
  params,
}: Readonly<{ params: Promise<{ agentTypeSlug: string; sourceId: string }> }>) {
  const { agentTypeSlug, sourceId } = await params;

  return (
    <Suspense fallback={<KnowledgeSourcePagesSkeleton />}>
      <KnowledgeSourcePagesView agentTypeSlug={agentTypeSlug} websiteSourceId={sourceId} />
    </Suspense>
  );
}
