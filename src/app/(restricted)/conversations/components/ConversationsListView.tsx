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

type MockConversation = {
  id: string;
  visitor: string;
  agent: string;
  lastMessage: string;
  status: keyof typeof t.conversations.status;
  updated: string;
};

const STATUS_TONE: Record<MockConversation['status'], StatusTone> = {
  open: 'info',
  escalated: 'danger',
  resolved: 'success',
};

const MOCK_CONVERSATIONS: readonly MockConversation[] = [
  {
    id: 'c-1',
    visitor: 'Visitor from /pricing',
    agent: 'Sales Concierge',
    lastMessage: 'Can I get a quote for 50 seats?',
    status: 'open',
    updated: '3m ago',
  },
  {
    id: 'c-2',
    visitor: 'Visitor from /help/billing',
    agent: 'Support Desk',
    lastMessage: 'I want to talk to a person about my invoice.',
    status: 'escalated',
    updated: '22m ago',
  },
  {
    id: 'c-3',
    visitor: 'Visitor from /docs',
    agent: 'Support Desk',
    lastMessage: 'Thanks, that answered my question.',
    status: 'resolved',
    updated: '1h ago',
  },
  {
    id: 'c-4',
    visitor: 'Visitor from /renew',
    agent: 'Renewals Assistant',
    lastMessage: 'What happens if I downgrade mid-cycle?',
    status: 'open',
    updated: '4h ago',
  },
];

/**
 * Sprint 1 static preview of the operator inbox list (frontend-plan-v3.md
 * §3.1, §5). Swap for `useConversationsList()` once
 * `GET /api/v1/agents/{id}/conversations/` ships, and drop `PreviewBanner`.
 */
export function ConversationsListView() {
  return (
    <div className="flex flex-col gap-6">
      <PreviewBanner note={t.conversations.previewNotice} />

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {t.conversations.title}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.conversations.description}</p>
      </div>

      <div className="border-border overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.conversations.table.visitor}</TableHead>
              <TableHead>{t.conversations.table.agent}</TableHead>
              <TableHead>{t.conversations.table.lastMessage}</TableHead>
              <TableHead>{t.conversations.table.status}</TableHead>
              <TableHead>{t.conversations.table.updated}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_CONVERSATIONS.map((conversation) => (
              <TableRow key={conversation.id}>
                <TableCell className="font-medium">{conversation.visitor}</TableCell>
                <TableCell className="text-muted-foreground">{conversation.agent}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {conversation.lastMessage}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={t.conversations.status[conversation.status]}
                    tone={STATUS_TONE[conversation.status]}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">{conversation.updated}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
