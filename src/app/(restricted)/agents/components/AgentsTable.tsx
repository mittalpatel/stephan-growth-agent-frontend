'use client';

import Link from 'next/link';

import {
  DataTable,
  DataTableBody,
  DataTableRow,
  dataTableHeadRow,
  dataTableTd,
  dataTableTh,
} from '@/components/common/DataTable';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/i18n';
import { t } from '@/locales';
import type { AgentListItem, AgentStatus } from '@/types/agent';

const STATUS_TONE: Record<AgentStatus, StatusTone> = {
  active: 'success',
  paused: 'warning',
  archived: 'neutral',
};

type Props = Readonly<{ agents: AgentListItem[] }>;

export function AgentsTable({ agents }: Props) {
  return (
    <DataTable minWidth={720}>
      <thead>
        <tr className={dataTableHeadRow}>
          <th className={dataTableTh}>{t.agents.columns.name}</th>
          <th className={dataTableTh}>{t.agents.columns.status}</th>
          <th className={`${dataTableTh} hidden lg:table-cell`}>{t.agents.columns.inboxEmail}</th>
          <th className={`${dataTableTh} hidden md:table-cell`}>{t.agents.columns.updatedAt}</th>
        </tr>
      </thead>
      <DataTableBody>
        {agents.map((agent) => (
          <DataTableRow key={agent.id}>
            <td className={dataTableTd}>
              <Link
                href={`/agents/${agent.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {agent.name}
              </Link>
            </td>
            <td className={dataTableTd}>
              <StatusBadge label={t.agents.status[agent.status]} tone={STATUS_TONE[agent.status]} />
            </td>
            <td className={`${dataTableTd} text-muted-foreground hidden text-sm lg:table-cell`}>
              {agent.human_inbox_email}
            </td>
            <td className={`${dataTableTd} text-muted-foreground hidden text-sm md:table-cell`}>
              {formatDate(agent.updated_at)}
            </td>
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}
