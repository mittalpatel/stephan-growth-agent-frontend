import type { Metadata } from 'next';
import { Suspense } from 'react';

import { t } from '@/locales';

import { KnowledgeSourcesSkeleton } from './components/KnowledgeSourcesSkeleton';
import { KnowledgeSourcesView } from './components/KnowledgeSourcesView';

export const metadata: Metadata = { title: t.knowledge.title };

/**
 * The agent-nested knowledge sources route. `params` is a Promise in Next
 * 16 — see `AGENTS.md`'s note on why it must be awaited rather than
 * destructured.
 */
export default async function AgentKnowledgePage({
  params,
}: Readonly<{ params: Promise<{ agentId: string }> }>) {
  const { agentId } = await params;

  return (
    <Suspense fallback={<KnowledgeSourcesSkeleton />}>
      <KnowledgeSourcesView agentId={agentId} />
    </Suspense>
  );
}
