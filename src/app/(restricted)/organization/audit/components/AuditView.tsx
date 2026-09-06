'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { ListPagination } from '@/components/common/ListPagination';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/i18n';
import { t } from '@/locales';
import type { AuditEventRow } from '@/services/organizations';

import { useOrganizationAudit } from '../hooks/useOrganizationAudit';
import AuditDetailSheet from './AuditDetailSheet';
import AuditSkeleton from './AuditSkeleton';

const copy = t.organizations.audit;

/**
 * The audit trail.
 *
 * Every column here is a denormalized value the backend captured at write time,
 * not a join resolved now — `actor_email` and `target_label` both outlive the
 * records they name, which is the point of a trail. The raw `target_type:id`
 * pair is deliberately *not* in the table: it is an identifier, not an answer to
 * "who was removed", and it lives in the detail sheet for the times correlation
 * matters more than legibility.
 *
 * Labels come from the backend rather than a local lookup map. The event
 * vocabulary is a Python enum that grows whenever a new auditable action is
 * added, and a client-side copy would render a raw slug for every value added
 * after it was written.
 */
export default function AuditView() {
  const list = useOrganizationAudit();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function renderBody() {
    if (list.isLoading) return <AuditSkeleton rows={list.limit} />;

    if (list.isError) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title={copy.errorTitle}
          description={copy.errorDescription}
          action={
            <Button variant="outline" onClick={() => void list.refetch()}>
              {t.buttons.tryAgain}
            </Button>
          }
        />
      );
    }

    if (list.events.length === 0) {
      // "Nothing matched your filters" and "nothing has happened yet" need
      // different copy: offering "clear filters" to someone with none set is
      // noise, and telling someone their filters matched nothing when the org is
      // simply new is misleading.
      return list.hasActiveFilters ? (
        <EmptyState
          title={copy.emptyFilteredTitle}
          description={copy.emptyFilteredDescription}
          action={
            <Button variant="outline" onClick={list.onResetFilters}>
              {t.buttons.resetFilters}
            </Button>
          }
        />
      ) : (
        <EmptyState title={copy.emptyTitle} description={copy.emptyDescription} />
      );
    }

    return (
      <div className="border-border overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{copy.columns.when}</TableHead>
              <TableHead>{copy.columns.actor}</TableHead>
              <TableHead>{copy.columns.action}</TableHead>
              <TableHead>{copy.columns.target}</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {formatDateTime(event.created_at)}
                </TableCell>
                <TableCell className="break-all">{event.actor_email || '—'}</TableCell>
                <TableCell>
                  <ActionCell event={event} />
                </TableCell>
                <TableCell className="break-words">{event.target_label || '—'}</TableCell>
                <TableCell>
                  {/* A real button, not a click handler on the row: the row
                      carries selectable text, and a clickable <tr> is invisible
                      to keyboard and screen-reader users. */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedId(event.id)}
                    aria-label={`${copy.detail.viewLabel} — ${event.event_label || event.action_label}`}
                  >
                    {copy.detail.viewLabel}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title={copy.title} description={copy.description} />

      <FilterToolbar
        title={list.title}
        total={list.total}
        displayed={list.displayed}
        isFetching={list.isFetching}
        searchTerm={list.searchTerm}
        onSearchChange={list.onSearchChange}
        onSearchClear={list.onSearchClear}
        searchPlaceholder={list.searchPlaceholder}
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
        // Unlike the projects demo, this list is entirely about *when* things
        // happened — "what changed last Tuesday" is the question it exists for.
        showDateRange
      />

      {renderBody()}

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

      <AuditDetailSheet
        organizationId={list.organizationId}
        eventId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}

/**
 * The specific event when there is one, falling back to the coarse action.
 *
 * Most rows have both — "Member removed" (event) inside "Deleted" (action). The
 * event is what a reader wants; the action is shown alongside it only where it
 * adds something, which is when no event was recorded.
 */
function ActionCell({ event }: { event: AuditEventRow }) {
  if (event.event_label) {
    return <Badge variant="secondary">{event.event_label}</Badge>;
  }
  return <Badge variant="outline">{event.action_label || event.action}</Badge>;
}
