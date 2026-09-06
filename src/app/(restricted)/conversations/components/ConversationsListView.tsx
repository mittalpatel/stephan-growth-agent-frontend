'use client';

import { useState } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';

import { useAgentOptions } from '@/app/(restricted)/hooks/useAgentOptions';
import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { ListPagination } from '@/components/common/ListPagination';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { t } from '@/locales';
import { organizationMembersEndpoint, organizationMembersKey } from '@/services/organizations';
import type { ApiResponse } from '@/types/api';
import type { ConversationStatus } from '@/types/conversation';

import { useConversationActions } from '../hooks/useConversationActions';
import { useConversationDetail } from '../hooks/useConversationDetail';
import { useConversationsList } from '../hooks/useConversationsList';

type OrganizationMember = { user_id: string; email: string; full_name: string };

const STATUS_TONE: Record<ConversationStatus, StatusTone> = {
  open: 'info',
  handoff_requested: 'warning',
  handoff_active: 'warning',
  resolved: 'success',
  abandoned: 'neutral',
};

function AssignOperator({ conversationId }: Readonly<{ conversationId: string }>) {
  const { organization } = useOrganization();
  const membersQuery = useAuthQuery<ApiResponse<OrganizationMember[]>>(
    organizationMembersKey(organization?.id ?? ''),
    organizationMembersEndpoint(organization?.id ?? ''),
    { enabled: Boolean(organization?.id) }
  );
  const members = membersQuery.data?.data ?? [];
  const { assign, isAssigning } = useConversationActions(conversationId);
  const [operatorId, setOperatorId] = useState<string>('');

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-[11px]">{t.conversations.detail.assignOperator}</p>
      <div className="flex gap-2">
        <Select value={operatorId} onValueChange={setOperatorId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t.conversations.detail.assignPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {members.map((member) => (
              <SelectItem key={member.user_id} value={member.user_id}>
                {member.full_name || member.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          disabled={!operatorId || isAssigning}
          onClick={() => void assign(operatorId)}
        >
          {t.conversations.detail.assign}
        </Button>
      </div>
    </div>
  );
}

function GenerateFollowup({ conversationId }: Readonly<{ conversationId: string }>) {
  const { generateFollowup, isGeneratingFollowup } = useConversationActions(conversationId);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isGeneratingFollowup}
      onClick={() => generateFollowup()}
    >
      {t.conversations.detail.generateFollowup}
    </Button>
  );
}

/**
 * Sprint 1 Phase 3: real conversations, wired to `GET
 * /agents/{id}/conversations/` and `GET /conversations/{id}/`. The backend
 * has no cross-agent conversations endpoint, so this page keeps an
 * agent-picker up top rather than moving under `/agents/[agentId]/...` — the
 * sidebar keeps one top-level "Conversations" nav item.
 *
 * Escalation resolve (plan Phase 3) is intentionally not built: the backend
 * exposes `POST /escalations/{id}/resolve/` but no read path returns an
 * escalation's id to the operator UI (`ConversationDetailSerializer` embeds
 * no escalations) — a real backend gap, documented in
 * `context/app/(restricted)/conversations/page.md`.
 */
export function ConversationsListView() {
  const { agents, isLoading: agentsLoading } = useAgentOptions();
  const { can } = usePermissions();
  const canManage = can('conversation', 'manage');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  // Defaults to the first agent once agents load, without an effect: the
  // selection is derived, so there's nothing to synchronize back into state
  // until the user actually picks a different agent.
  const agentId = selectedAgentId || (agents[0]?.id ?? '');

  const list = useConversationsList(agentId);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const activeId = selectedConversationId ?? list.conversations[0]?.id ?? null;

  const { conversation, isLoading: detailLoading } = useConversationDetail(activeId);

  function renderList() {
    if (list.isLoading) {
      return (
        <div className="space-y-2 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }
    if (list.isError) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title={t.conversations.list.errorTitle}
          description={t.conversations.list.errorDescription}
          action={
            <Button variant="outline" size="sm" onClick={() => void list.refetch()}>
              {t.buttons.tryAgain}
            </Button>
          }
        />
      );
    }
    if (list.conversations.length === 0) {
      return (
        <EmptyState
          title={
            list.hasActiveFilters
              ? t.conversations.list.emptyFilteredTitle
              : t.conversations.list.emptyTitle
          }
          description={
            list.hasActiveFilters
              ? t.conversations.list.emptyFilteredDescription
              : t.conversations.list.emptyDescription
          }
        />
      );
    }
    return list.conversations.map((c) => (
      <button
        key={c.id}
        type="button"
        onClick={() => setSelectedConversationId(c.id)}
        className={cn(
          'border-border w-full border-b px-4 py-3.5 text-left transition-colors',
          activeId === c.id ? 'bg-primary/10' : 'hover:bg-muted'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold">
            {c.assigned_operator_email ?? t.conversations.detail.unassigned}
          </p>
          <StatusBadge label={t.conversations.status[c.status]} tone={STATUS_TONE[c.status]} />
        </div>
        <p className="text-muted-foreground mt-1 text-[11px]">{formatDate(c.created_at)}</p>
      </button>
    ));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.conversations.title} description={t.conversations.description} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-muted-foreground text-xs font-medium">
            {t.conversations.agentPicker.label}
          </label>
          <Select
            value={agentId}
            onValueChange={(value) => {
              setSelectedAgentId(value);
              setSelectedConversationId(null);
            }}
            disabled={agentsLoading}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder={t.conversations.agentPicker.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!agentsLoading && agents.length === 0 ? (
        <EmptyState title={t.conversations.agentPicker.empty} />
      ) : (
        <>
          <FilterToolbar
            title={t.conversations.title}
            total={list.total}
            displayed={list.conversations.length}
            isFetching={list.isFetching}
            searchTerm=""
            onSearchChange={() => {}}
            onSearchClear={() => {}}
            sortField={list.sortField}
            sortDirection={list.sortDirection}
            sortOptions={list.sortOptions}
            onSortFieldChange={list.onSortFieldChange}
            onSortDirectionToggle={list.onSortDirectionToggle}
            limit={list.limit}
            limitOptions={list.limitOptions}
            onLimitChange={list.onLimitChange}
            onResetFilters={list.onResetFilters}
            filterConfigs={list.filterConfigs}
            activeFilters={list.activeFilters}
            onFilterChange={list.onFilterChange}
            showDateRange={false}
          />

          <div className="border-border bg-card grid h-[640px] overflow-hidden rounded-2xl border lg:grid-cols-[300px_1fr_280px]">
            <div className="border-border overflow-y-auto border-r">{renderList()}</div>

            <div className="flex min-w-0 flex-col">
              {!activeId || detailLoading ? (
                <div className="flex flex-1 items-center justify-center p-8">
                  <p className="text-muted-foreground text-sm">
                    {t.conversations.list.selectPrompt}
                  </p>
                </div>
              ) : (
                <>
                  <div className="border-border flex items-center justify-between border-b px-5 py-4">
                    <div>
                      <p className="font-semibold">
                        {conversation?.assigned_operator_email ?? t.conversations.detail.unassigned}
                      </p>
                      <p className="text-muted-foreground text-xs">{conversation?.language}</p>
                    </div>
                    {conversation && (
                      <StatusBadge
                        label={t.conversations.status[conversation.status]}
                        tone={STATUS_TONE[conversation.status]}
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
                    {conversation?.messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          'flex',
                          m.role === 'visitor' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                            m.role === 'visitor'
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted rounded-bl-sm'
                          )}
                        >
                          {m.role === 'agent' && (
                            <div className="text-primary mb-1 flex items-center gap-1.5 text-[11px] font-semibold">
                              <Sparkles className="size-[11px]" />{' '}
                              {t.conversations.detail.transcriptHeading}
                            </div>
                          )}
                          <p>{m.content}</p>
                          {m.citations.length > 0 && (
                            <p
                              className={cn(
                                'mt-1 text-[10px]',
                                m.role === 'visitor'
                                  ? 'text-primary-foreground/60'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {t.conversations.detail.citationsLabel}:{' '}
                              {m.citations.map((c) => c.source_title).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="border-border flex flex-col gap-5 overflow-y-auto border-l p-5">
              {conversation && (
                <>
                  <div>
                    <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                      {t.conversations.detail.summaryHeading}
                    </p>
                    <p className="text-sm">
                      {conversation.summary || t.conversations.detail.noSummary}
                    </p>
                  </div>
                  {canManage && <AssignOperator conversationId={conversation.id} />}
                  {canManage && <GenerateFollowup conversationId={conversation.id} />}
                </>
              )}
            </div>
          </div>

          {list.totalPages > 1 && (
            <ListPagination
              currentPage={list.currentPage}
              totalPages={list.totalPages}
              limit={list.limit}
              limitOptions={list.limitOptions}
              onPageChange={list.onPageChange}
              onLimitChange={list.onLimitChange}
            />
          )}
        </>
      )}
    </div>
  );
}
