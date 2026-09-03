'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

import { PreviewBanner } from '@/components/common/PreviewBanner';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { t } from '@/locales';

type MockAgent = {
  id: string;
  name: string;
  type: string;
  status: keyof typeof t.agents.status;
  conversations: number;
  leads: number;
  updated: string;
};

const STATUS_TONE: Record<MockAgent['status'], StatusTone> = {
  published: 'success',
  draft: 'neutral',
  paused: 'warning',
};

const MOCK_AGENTS: readonly MockAgent[] = [
  {
    id: 'sales-concierge',
    name: 'Sales Concierge',
    type: t.agents.type.sales,
    status: 'published',
    conversations: 62,
    leads: 24,
    updated: '2 days ago',
  },
  {
    id: 'support-desk',
    name: 'Support Desk',
    type: t.agents.type.support,
    status: 'published',
    conversations: 41,
    leads: 3,
    updated: '5 hours ago',
  },
  {
    id: 'onboarding-guide',
    name: 'Onboarding Guide',
    type: t.agents.type.support,
    status: 'draft',
    conversations: 0,
    leads: 0,
    updated: '1 day ago',
  },
  {
    id: 'renewals-assistant',
    name: 'Renewals Assistant',
    type: t.agents.type.sales,
    status: 'paused',
    conversations: 7,
    leads: 2,
    updated: '3 weeks ago',
  },
];

/**
 * Sprint 1 static preview of the agents list (frontend-plan-v3.md §3.1).
 * Swap `MOCK_AGENTS` for `useAgentsList()` once `GET /api/v1/agents/` ships,
 * and drop `PreviewBanner`.
 */
export function AgentsListView() {
  return (
    <div className="flex flex-col gap-6">
      <PreviewBanner note={t.agents.previewNotice} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{t.agents.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.agents.description}</p>
        </div>
        <Button className="gap-1.5" disabled>
          <Plus className="size-4" />
          {t.agents.newAgent}
        </Button>
      </div>

      <div className="border-border overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.agents.table.name}</TableHead>
              <TableHead>{t.agents.table.type}</TableHead>
              <TableHead>{t.agents.table.status}</TableHead>
              <TableHead>{t.agents.table.conversations}</TableHead>
              <TableHead>{t.agents.table.leads}</TableHead>
              <TableHead>{t.agents.table.updated}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_AGENTS.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell>
                  <Link
                    href={`/agents/${agent.id}`}
                    className="hover:text-brand-accent font-medium underline-offset-4 hover:underline"
                  >
                    {agent.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{agent.type}</TableCell>
                <TableCell>
                  <StatusBadge
                    label={t.agents.status[agent.status]}
                    tone={STATUS_TONE[agent.status]}
                  />
                </TableCell>
                <TableCell>{agent.conversations}</TableCell>
                <TableCell>{agent.leads}</TableCell>
                <TableCell className="text-muted-foreground">{agent.updated}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
