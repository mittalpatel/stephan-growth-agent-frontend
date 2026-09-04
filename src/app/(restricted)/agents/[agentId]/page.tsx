import type { Metadata } from 'next';
import { Suspense } from 'react';

import { t } from '@/locales';

import { AgentDetailSkeleton } from './components/AgentDetailSkeleton';
import { AgentDetailView } from './components/AgentDetailView';

export const metadata: Metadata = { title: t.agents.title };

/**
 * The agent detail route. `params` is a Promise in Next 16 — see
 * `AGENTS.md`'s note on why it must be awaited rather than destructured.
 */
export default async function AgentDetailPage({
  params,
}: Readonly<{ params: Promise<{ agentId: string }> }>) {
  const { agentId } = await params;

  return (
    <Suspense fallback={<AgentDetailSkeleton />}>
      <AgentDetailView agentId={agentId} />
    </Suspense>
  );
}
