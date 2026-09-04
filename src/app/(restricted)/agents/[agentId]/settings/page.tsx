import type { Metadata } from 'next';
import { Suspense } from 'react';

import { t } from '@/locales';

import { AgentSettingsSkeleton } from './components/AgentSettingsSkeleton';
import { AgentSettingsView } from './components/AgentSettingsView';

export const metadata: Metadata = { title: t.agents.settings.title };

/**
 * The agent-nested settings route. `params` is a Promise in Next 16 — see
 * `AGENTS.md`'s note on why it must be awaited rather than destructured.
 */
export default async function AgentSettingsPage({
  params,
}: Readonly<{ params: Promise<{ agentId: string }> }>) {
  const { agentId } = await params;

  return (
    <Suspense fallback={<AgentSettingsSkeleton />}>
      <AgentSettingsView agentId={agentId} />
    </Suspense>
  );
}
