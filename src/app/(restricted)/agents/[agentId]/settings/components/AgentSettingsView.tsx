'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { t } from '@/locales';

import { AllowedDomainsSection } from './AllowedDomainsSection';
import { DeploymentKeysSection } from './DeploymentKeysSection';
import { EmbedSnippetSection } from './EmbedSnippetSection';

type Props = Readonly<{ agentId: string }>;

/**
 * Allowed domains, deployment keys, and an embed snippet for one agent. Net
 * new page, no mock precedent. Every action here requires `agent:manage`
 * (the same permission the Draft/Overview tabs gate writes on) since there
 * is nothing to merely view: `AgentDomainListCreateView`/`AgentKeyListCreateView`
 * expose only create/delete/revoke, no list read — see
 * `context/app/(restricted)/agents/[agentId]/settings/page.md` for the gap.
 */
export function AgentSettingsView({ agentId }: Props) {
  const { can } = usePermissions();
  const canManage = can('agent', 'manage');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/agents/${agentId}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t.agents.detail.backToList}
        </Link>
        <div className="mt-2">
          <PageHeader title={t.agents.settings.title} description={t.agents.settings.description} />
        </div>
      </div>

      {!canManage ? (
        <EmptyState
          title={t.agents.settings.noPermissionTitle}
          description={t.agents.settings.noPermissionDescription}
        />
      ) : (
        <>
          <AllowedDomainsSection agentId={agentId} />
          <DeploymentKeysSection agentId={agentId} />
          <EmbedSnippetSection />
        </>
      )}
    </div>
  );
}
