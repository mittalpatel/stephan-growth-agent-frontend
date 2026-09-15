'use client';

import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { format } from '@/lib/i18n';
import { t } from '@/locales';
import type { Agent } from '@/types/agent';

import { AgentIdentitySection } from './AgentIdentitySection';
import { AllowedDomainsSection } from './AllowedDomainsSection';
import { DeploymentKeysSection } from './DeploymentKeysSection';
import { EmbedSnippetSection } from './EmbedSnippetSection';

type Props = Readonly<{ agent: Agent }>;

const install = t.agents.settings.install;

function Step({ number, children }: Readonly<{ number: number; children: ReactNode }>) {
  return (
    <div className="space-y-2">
      <p className="text-primary-strong text-xs font-semibold tracking-wider uppercase">
        {format(install.step, { number })}
      </p>
      {children}
    </div>
  );
}

/**
 * The Settings tab, ordered to match the sequence a user actually needs
 * (2026-09-09): identity, then allowed domains (must exist before the
 * widget will load anywhere), then the embed code (the one place a
 * deployment key gets minted — `EmbedSnippetSection`), then the issued-keys
 * list (`DeploymentKeysSection`, read-only + revoke only).
 *
 * Domains and embed code are grouped under one numbered "install" heading
 * (2026-09-15): the order was right but nothing said the second depends on
 * the first, and a snippet pasted before its domain is allowed fails silently.
 *
 * `agent:view` can see the lists, `agent:manage` can add/remove/revoke/generate
 * — gated per control inside each section rather than only here.
 */
export function AgentSettingsView({ agent }: Props) {
  const { can } = usePermissions();
  const canView = can('agent', 'view');

  if (!canView) {
    return (
      <EmptyState
        icon={Lock}
        title={t.agents.settings.noPermissionTitle}
        description={t.agents.settings.noPermissionDescription}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <AgentIdentitySection agent={agent} />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold">{install.title}</h2>
          <p className="text-muted-foreground text-sm">{install.description}</p>
        </div>
        <Step number={1}>
          <AllowedDomainsSection agentId={agent.id} />
        </Step>
        <Step number={2}>
          <EmbedSnippetSection agentId={agent.id} />
        </Step>
      </section>

      <DeploymentKeysSection agentId={agent.id} />
    </div>
  );
}
