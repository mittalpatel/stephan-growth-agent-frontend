'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Sparkles, UserRound } from 'lucide-react';

import { useAgentOptions } from '@/app/(restricted)/hooks/useAgentOptions';
import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { EmptyState } from '@/components/common/EmptyState';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { ConversationTranscript } from '@/components/common/ConversationTranscript';
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
import { format, formatDate, formatDateTime } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { t } from '@/locales';
import { conversationDetailKey } from '@/services/conversations';
import { organizationMembersEndpoint, organizationMembersKey } from '@/services/organizations';
import type { ApiResponse } from '@/types/api';
import type { Conversation, ConversationStatus } from '@/types/conversation';

import { useConversationActions } from '../hooks/useConversationActions';
import { useConversationDetail } from '../hooks/useConversationDetail';
import { useConversationMessages } from '../hooks/useConversationMessages';
import { useConversationRealtime } from '../hooks/useConversationRealtime';
import { useConversationsList } from '../hooks/useConversationsList';
import { ConversationHandoffControls, ConversationPresence } from './ConversationHandoffControls';
import { OperatorReplyComposer } from './OperatorReplyComposer';

type OrganizationMember = { user_id: string; email: string; full_name: string };

/** Radix `Select` cannot carry an empty-string value, so the "every agent"
 * choice needs a sentinel of its own rather than reusing "nothing picked". */
const ALL_AGENTS = 'all-agents';

/** The two states where a human is expected to be reading this conversation
 * right now, and so the two where the screen keeps itself current. */
const HANDOFF_STATUSES: readonly ConversationStatus[] = ['handoff_requested', 'handoff_active'];

const STATUS_TONE: Record<ConversationStatus, StatusTone> = {
  open: 'info',
  // One tone per status so the queue scans at a glance: a visitor waiting on a
  // human is the most urgent row, a human already replying is in progress.
  handoff_requested: 'danger',
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
    // Stacked, not side by side: a 280px column cannot fit a select and a
    // button in one row, which pushed "Assign" out of view behind a scrollbar.
    <div className="flex min-w-0 flex-col gap-2">
      <label className="text-xs font-medium">{t.conversations.detail.assignOperator}</label>
      <Select value={operatorId} onValueChange={setOperatorId}>
        <SelectTrigger className="w-full min-w-0">
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
        className="w-full"
        disabled={!operatorId || isAssigning}
        onClick={() => assign(operatorId)}
      >
        {t.conversations.detail.assign}
      </Button>
    </div>
  );
}

function GenerateFollowup({ conversationId }: Readonly<{ conversationId: string }>) {
  const { generateFollowup, isGeneratingFollowup } = useConversationActions(conversationId);

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      disabled={isGeneratingFollowup}
      onClick={() => generateFollowup()}
    >
      <Sparkles className="size-4" aria-hidden />
      {t.conversations.detail.generateFollowup}
    </Button>
  );
}

/**
 * Sprint 1 Phase 3: real conversations, wired to `GET /conversations/`,
 * `GET /agents/{id}/conversations/` and `GET /conversations/{id}/`. The
 * standalone page defaults to every agent's conversations (the org-wide
 * queue) and narrows to one through the picker up top.
 *
 * Passing `agentId` pins it to one agent and drops both the page header and
 * the picker, which is how the agent detail page's Conversations tab reuses
 * it. There is deliberately only one implementation of this screen.
 *
 * Control between the AI and a human moves through explicit claim, release
 * and resolve calls (`useConversationHandoff`), with live pushes and operator
 * presence from `useConversationRealtime`. See
 * `context/app/(restricted)/conversations/page.md`.
 */
type Props = Readonly<{
  /** Pins the view to one agent, for the agent detail page's tab. */
  agentId?: string;
}>;

export function ConversationsListView({ agentId: pinnedAgentId }: Props = {}) {
  const { agents, isLoading: agentsLoading } = useAgentOptions();
  const { can } = usePermissions();
  const canManage = can('conversation', 'manage');
  // Defaults to every agent, not the first one: the standalone page is the
  // queue an operator watches to find conversations that need a human, and
  // which agent produced one is not how they are triaged.
  const [selectedAgentId, setSelectedAgentId] = useState(ALL_AGENTS);
  const agentId = pinnedAgentId ?? (selectedAgentId === ALL_AGENTS ? null : selectedAgentId);

  const list = useConversationsList(agentId);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const activeId = selectedConversationId ?? list.conversations[0]?.id ?? null;

  // The cached detail wins once it exists, since claim/release patch it
  // directly while the list row can be seconds stale; the list row covers the
  // first fetch so polling is already on for it. Reading the cache here stays
  // current because `useConversationDetail` below re-renders on every change.
  const queryClient = useQueryClient();
  const cachedDetail = activeId
    ? queryClient.getQueryData<ApiResponse<Conversation>>(conversationDetailKey(activeId))
    : undefined;
  const activeStatus =
    cachedDetail?.data.status ?? list.conversations.find((c) => c.id === activeId)?.status;
  const isLive = activeStatus !== undefined && HANDOFF_STATUSES.includes(activeStatus);

  const { conversation, isLoading: detailLoading } = useConversationDetail(activeId, {
    live: isLive,
  });
  const transcript = useConversationMessages(activeId, { live: isLive });
  const { otherViewers, notifyTyping } = useConversationRealtime(activeId);

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
      {!pinnedAgentId && (
        <PageHeader title={t.conversations.title} description={t.conversations.description} />
      )}

      <div className={pinnedAgentId ? 'hidden' : 'flex flex-wrap items-end gap-3'}>
        <div className="flex flex-col gap-1.5">
          <label className="text-muted-foreground text-xs font-medium">
            {t.conversations.agentPicker.label}
          </label>
          <Select
            value={selectedAgentId}
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
              <SelectItem value={ALL_AGENTS}>{t.conversations.agentPicker.allAgents}</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!pinnedAgentId && !agentsLoading && agents.length === 0 ? (
        <EmptyState title={t.conversations.agentPicker.empty} />
      ) : (
        <>
          <FilterToolbar
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

          <div className="border-border bg-card grid h-[min(760px,calc(100dvh-10rem))] min-h-130 overflow-hidden rounded-2xl border lg:grid-cols-[300px_1fr_280px] lg:grid-rows-[minmax(0,1fr)]">
            <div className="border-border min-h-0 overflow-y-auto border-r scrollbar-thin">
              {renderList()}
            </div>

            <div className="flex min-h-0 min-w-0 flex-col">
              {!activeId || detailLoading ? (
                <div className="flex flex-1 items-center justify-center p-8">
                  <p className="text-muted-foreground text-sm">
                    {t.conversations.list.selectPrompt}
                  </p>
                </div>
              ) : (
                <>
                  {conversation && (
                    // Title and status together on the left, actions on the
                    // right: the operator's first question is "what state is
                    // this in", and the badge used to sit apart from it,
                    // wedged in beside the buttons.
                    <div className="border-border flex shrink-0 flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold">{t.conversations.detail.title}</h2>
                          <StatusBadge
                            label={t.conversations.status[conversation.status]}
                            tone={STATUS_TONE[conversation.status]}
                          />
                          {conversation.language && (
                            <span className="border-border text-muted-foreground rounded border px-1.5 text-[10px] font-medium uppercase">
                              {conversation.language}
                            </span>
                          )}
                          {conversation.active_escalation && (
                            <StatusBadge
                              label={format(t.conversations.detail.escalatedFor, {
                                reason:
                                  t.conversations.detail.escalationReason[
                                    conversation.active_escalation.reason
                                  ] ?? t.conversations.detail.escalationReasonUnknown,
                              })}
                              tone="warning"
                            />
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {format(t.conversations.detail.startedAt, {
                            date: formatDateTime(conversation.created_at),
                          })}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <UserRound className="size-3.5" aria-hidden />
                          {conversation.assigned_operator_email
                            ? format(t.conversations.detail.handledBy, {
                                email: conversation.assigned_operator_email,
                              })
                            : t.conversations.detail.notAssigned}
                        </p>
                        <ConversationPresence viewers={otherViewers} />
                      </div>
                      {canManage && (
                        <ConversationHandoffControls
                          conversationId={conversation.id}
                          status={conversation.status}
                        />
                      )}
                    </div>
                  )}
                  {/* The accumulated pages are discarded by the query key
                      changing with `activeId`; this key resets the component's
                      own scroll position and pinned-to-bottom ref, so the next
                      conversation opens at its newest turn rather than
                      inheriting the previous one's scroll. Suffixed
                      per-component since these two are siblings in the same
                      fragment: React keys only need to be unique among
                      siblings, not per element type, so both bare on
                      `activeId` collided the moment a conversation was
                      selected. */}
                  <ConversationTranscript key={`transcript-${activeId}`} {...transcript} />
                  {/* Keyed on the conversation only, never its status: a claim
                      changes status, and remounting then would wipe a draft. */}
                  {canManage && conversation && (
                    <OperatorReplyComposer
                      key={`composer-${activeId}`}
                      conversationId={activeId}
                      status={conversation.status}
                      assignedOperatorEmail={conversation.assigned_operator_email}
                      onTyping={notifyTyping}
                    />
                  )}
                </>
              )}
            </div>

            <div className="border-border flex min-w-0 flex-col gap-6 overflow-x-hidden overflow-y-auto border-l p-5">
              {conversation && (
                <>
                  <section>
                    <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                      {t.conversations.detail.summaryHeading}
                    </h3>
                    <p
                      className={cn(
                        'text-sm',
                        !conversation.summary && 'text-muted-foreground italic'
                      )}
                    >
                      {conversation.summary || t.conversations.detail.noSummary}
                    </p>
                  </section>
                  <section className="border-border flex flex-col gap-2 border-t pt-5">
                    <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      {t.conversations.detail.escalationsHeading}
                    </h3>
                    {conversation.escalations.length === 0 ? (
                      <p className="text-muted-foreground text-sm italic">
                        {t.conversations.detail.noEscalations}
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {conversation.escalations.map((escalation) => (
                          <li key={escalation.id} className="text-sm">
                            <p className="text-foreground">
                              {t.conversations.detail.escalationReason[escalation.reason] ??
                                t.conversations.detail.escalationReasonUnknown}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {escalation.resolved_at
                                ? format(t.conversations.detail.escalationResolvedAt, {
                                    date: formatDateTime(escalation.resolved_at),
                                  })
                                : t.conversations.detail.escalationOpen}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                  {canManage && (
                    <section className="border-border flex flex-col gap-4 border-t pt-5">
                      <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                        {t.conversations.detail.actionsHeading}
                      </h3>
                      <AssignOperator conversationId={conversation.id} />
                      <GenerateFollowup conversationId={conversation.id} />
                    </section>
                  )}
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
