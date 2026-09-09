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
 * The Settings tab, ordered to match the sequence a user actually needs
 * (2026-09-09): identity, then allowed domains (must exist before the
 * widget will load anywhere), then the embed code (the one place a
 * deployment key gets minted — `EmbedSnippetSection`), then the issued-keys
 * list (`DeploymentKeysSection`, read-only + revoke only; it used to have
 * its own separate "Issue key" button that minted an unrelated, unlabeled
 * key with no snippet — removed as a redundant, confusing second way to
 * create the same kind of credential).
 *
 * This was a separate `/agents/[id]/settings` route until the agent detail
 * page moved to the reference platform's tabbed layout. The identity form
 * came from what used to be the Overview tab, which now carries performance
 * and capabilities instead, matching the reference's split.
 *
 * `GET` on both list endpoints landed 2026-09-07, so this follows the
 * standard view/manage split: `agent:view` can see the lists, `agent:manage`
 * can add/remove/revoke/generate — gated per control inside
 * `AllowedDomainsSection`/`DeploymentKeysSection`/`EmbedSnippetSection`
 * rather than only here.
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
      <EmbedSnippetSection agentId={agent.id} />
      <DeploymentKeysSection agentId={agent.id} />
    </div>
  );
}
