'use client';

import { PreviewBanner } from '@/components/common/PreviewBanner';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { t } from '@/locales';

type MockLead = {
  id: string;
  name: string;
  email: string;
  agent: string;
  status: keyof typeof t.leads.status;
  captured: string;
};

const STATUS_TONE: Record<MockLead['status'], StatusTone> = {
  new: 'info',
  contacted: 'warning',
  qualified: 'success',
};

const MOCK_LEADS: readonly MockLead[] = [
  {
    id: 'l-1',
    name: 'Jordan Blake',
    email: 'jordan@northwind.example',
    agent: 'Sales Concierge',
    status: 'new',
    captured: '48m ago',
  },
  {
    id: 'l-2',
    name: 'Priya Nair',
    email: 'priya@acme.example',
    agent: 'Sales Concierge',
    status: 'qualified',
    captured: '1d ago',
  },
  {
    id: 'l-3',
    name: 'Sam Okafor',
    email: 'sam@globex.example',
    agent: 'Renewals Assistant',
    status: 'contacted',
    captured: '3d ago',
  },
];

/**
 * Sprint 1 static preview of the leads list (frontend-plan-v3.md §3.1, §5).
 * Swap for `useLeadsList()` once `GET /api/v1/leads/` ships, and drop
 * `PreviewBanner`.
 */
export function LeadsListView() {
  return (
    <div className="flex flex-col gap-6">
      <PreviewBanner note={t.leads.previewNotice} />

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{t.leads.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.leads.description}</p>
      </div>

      <div className="border-border overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.leads.table.name}</TableHead>
              <TableHead>{t.leads.table.email}</TableHead>
              <TableHead>{t.leads.table.agent}</TableHead>
              <TableHead>{t.leads.table.status}</TableHead>
              <TableHead>{t.leads.table.captured}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_LEADS.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                <TableCell className="text-muted-foreground">{lead.agent}</TableCell>
                <TableCell>
                  <StatusBadge
                    label={t.leads.status[lead.status]}
                    tone={STATUS_TONE[lead.status]}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">{lead.captured}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
