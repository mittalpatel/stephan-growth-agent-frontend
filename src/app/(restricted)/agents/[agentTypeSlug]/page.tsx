import type { Metadata } from 'next';
import { Suspense } from 'react';

import { t } from '@/locales';

import { AgentDetailSkeleton } from './components/AgentDetailSkeleton';
import { AgentDetailView } from './components/AgentDetailView';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return { title: t.agents.title };
}

/**
 * The agent detail route, keyed by `AgentType` slug (`/agents/sevo`) rather
 * than agent UUID, matching the reference platform's own URLs and the
 * backend's `GET /agents/by-type/<slug>/`.
 *
 * `params` is a Promise in Next 16 — see `AGENTS.md`'s note on why it must be
 * awaited rather than destructured.
 */
export default async function AgentDetailPage({
  params,
}: Readonly<{ params: Promise<{ agentTypeSlug: string }> }>) {
  const { agentTypeSlug } = await params;

  return (
    <Suspense fallback={<AgentDetailSkeleton />}>
      <AgentDetailView agentTypeSlug={agentTypeSlug} />
    </Suspense>
  );
}
