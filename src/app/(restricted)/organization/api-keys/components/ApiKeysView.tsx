'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { VariantProps } from 'class-variance-authority';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { FilterToolbar } from '@/components/common/FilterToolbar';
import { ListPagination } from '@/components/common/ListPagination';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, formatDate, formatDateTime, plural } from '@/lib/i18n';
import { t } from '@/locales';
import type { ApiKeyRow, ApiKeyStatus, ApiKeyCreateResponse } from '@/services/apiKeys';

import { useOrganizationApiKeys } from '../hooks/useOrganizationApiKeys';
import ApiKeysSkeleton from './ApiKeysSkeleton';
import CreateApiKeyDialog from './CreateApiKeyDialog';
import RevealSecretDialog from './RevealSecretDialog';

const copy = t.organizations.apiKeys;

const STATUS_VARIANT: Record<ApiKeyStatus, VariantProps<typeof badgeVariants>['variant']> = {
  active: 'secondary',
  expired: 'outline',
  revoked: 'destructive',
};

const STATUS_LABEL: Record<ApiKeyStatus, string> = {
  active: copy.status.active,
  expired: copy.status.expired,
  revoked: copy.status.revoked,
};

export default function ApiKeysView() {
  const list = useOrganizationApiKeys();
  const [confirming, setConfirming] = useState<ApiKeyRow | null>(null);
  const [revealedKey, setRevealedKey] = useState<ApiKeyCreateResponse | null>(null);

  function renderBody() {
    if (list.isLoading) return <ApiKeysSkeleton rows={list.limit} />;

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

    if (list.keys.length === 0) {
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
        <EmptyState
          title={copy.emptyTitle}
          description={copy.emptyDescription}
          action={<CreateApiKeyDialog onCreated={setRevealedKey} />}
        />
      );
    }

    return (
      <div className="border-border overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{copy.columns.name}</TableHead>
              <TableHead>{copy.columns.prefix}</TableHead>
              <TableHead>{copy.columns.status}</TableHead>
              <TableHead>{copy.columns.permissions}</TableHead>
              <TableHead>{copy.columns.lastUsed}</TableHead>
              <TableHead>{copy.columns.expires}</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.keys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  {key.prefix}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[key.status]}>{STATUS_LABEL[key.status]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {plural(key.permission_count, copy.permissionCount)}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {key.last_used_at ? formatDateTime(key.last_used_at) : copy.never}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {key.expires_at ? formatDate(key.expires_at) : copy.noExpiry}
                </TableCell>
                <TableCell>
                  {key.status !== 'revoked' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={list.pendingKeyId === key.id}
                      onClick={() => setConfirming(key)}
                    >
                      {copy.revoke}
                    </Button>
                  )}
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
        trailingAction={
          list.keys.length > 0 ? <CreateApiKeyDialog onCreated={setRevealedKey} /> : undefined
        }
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

      <ConfirmDialog
        open={confirming !== null}
        destructive
        title={format(copy.revokeConfirmTitle, { name: confirming?.name ?? '' })}
        message={copy.revokeConfirmBody}
        loading={list.pendingKeyId !== null}
        onConfirm={() => {
          if (confirming) void list.revokeKey(confirming.id);
          setConfirming(null);
        }}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
      />

      <RevealSecretDialog
        secret={revealedKey?.secret ?? null}
        onDismiss={() => {
          setRevealedKey(null);
          void list.refetch();
        }}
      />
    </div>
  );
}
