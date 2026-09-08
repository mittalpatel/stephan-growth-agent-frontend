'use client';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { t } from '@/locales';
import type { Agent } from '@/types/agent';

import { AgentIdentitySection } from './AgentIdentitySection';
import { AllowedDomainsSection } from './AllowedDomainsSection';
import { DeploymentKeysSection } from './DeploymentKeysSection';
import { EmbedSnippetSection } from './EmbedSnippetSection';

type Props = Readonly<{ agent: Agent }>;

/**
 * The Settings tab: the agent's own editable fields, then allowed domains,
 * deployment keys, and an embed snippet.
 *
 * This was a separate `/agents/[id]/settings` route until the agent detail
 * page moved to the reference platform's tabbed layout. The identity form
 * came from what used to be the Overview tab, which now carries performance
 * and capabilities instead, matching the reference's split.
 *
 * `GET` on both list endpoints landed 2026-09-07, so this follows the
 * standard view/manage split: `agent:view` can see the lists, `agent:manage`
 * can add/issue/remove/revoke — gated per control inside
 * `AllowedDomainsSection`/`DeploymentKeysSection` rather than only here.
 */
export function AgentSettingsView({ agent }: Props) {
  const { can } = usePermissions();
  const canView = can('agent', 'view');

  if (!canView) {
    return (
      <EmptyState
        title={t.agents.settings.noPermissionTitle}
        description={t.agents.settings.noPermissionDescription}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AgentIdentitySection agent={agent} />
      <AllowedDomainsSection agentId={agent.id} />
      <DeploymentKeysSection agentId={agent.id} />
      <EmbedSnippetSection agentId={agent.id} />
    </div>
  );
}
