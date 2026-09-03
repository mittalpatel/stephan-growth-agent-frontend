'use client';

import { useMemo, useState } from 'react';
import { ChevronRight, ChevronLeft, Lock, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

export interface TransferListPermission {
  code: string;
  resource: string;
  label: string;
}

type Props = Readonly<{
  catalog: TransferListPermission[];
  selected: string[];
  onChange: (codes: string[]) => void;
  /** Codes the acting user does not themselves hold — shown locked, never movable. */
  isGrantable: (code: string) => boolean;
  disabled?: boolean;
}>;

type Panel = 'available' | 'granted';

function groupByResource<T extends { resource: string }>(items: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const bucket = groups.get(item.resource) ?? [];
    bucket.push(item);
    groups.set(item.resource, bucket);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

/**
 * A dual-panel permission picker: drag a permission between "Available" and
 * "Granted", or use the arrow button — drag is a shortcut, never the only path,
 * since drag-and-drop alone is unusable by keyboard or screen-reader users.
 *
 * Locked (non-grantable) permissions render in the available panel but can be
 * neither dragged nor clicked — a visual mirror of the server's ceiling rule,
 * not a substitute for it. The service re-checks every code regardless.
 */
export default function PermissionTransferList({
  catalog,
  selected,
  onChange,
  isGrantable,
  disabled = false,
}: Props) {
  const [search, setSearch] = useState('');
  const [dragCode, setDragCode] = useState<string | null>(null);
  const [dragOverPanel, setDragOverPanel] = useState<Panel | null>(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const query = search.trim().toLowerCase();

  const available = useMemo(
    () =>
      catalog.filter(
        (item) =>
          !selectedSet.has(item.code) &&
          (query === '' ||
            item.code.toLowerCase().includes(query) ||
            item.label.toLowerCase().includes(query))
      ),
    [catalog, selectedSet, query]
  );
  const granted = useMemo(
    () =>
      catalog.filter(
        (item) =>
          selectedSet.has(item.code) &&
          (query === '' ||
            item.code.toLowerCase().includes(query) ||
            item.label.toLowerCase().includes(query))
      ),
    [catalog, selectedSet, query]
  );

  const grant = (code: string) => {
    if (disabled || !isGrantable(code) || selectedSet.has(code)) return;
    onChange([...selected, code]);
  };

  const revoke = (code: string) => {
    if (disabled) return;
    onChange(selected.filter((item) => item !== code));
  };

  const handleDrop = (panel: Panel) => (event: React.DragEvent) => {
    event.preventDefault();
    setDragOverPanel(null);
    const code = event.dataTransfer.getData('text/plain') || dragCode;
    if (!code) return;
    if (panel === 'granted') grant(code);
    else revoke(code);
    setDragCode(null);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.organizations.roles.searchPlaceholder}
          className="pl-8"
          aria-label={t.organizations.roles.searchPlaceholder}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TransferPanel
          title={t.organizations.roles.availableTitle}
          count={available.length}
          groups={groupByResource(available)}
          emptyLabel={t.organizations.roles.availableEmpty}
          isDragOver={dragOverPanel === 'available'}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOverPanel('available');
          }}
          onDragLeave={() => setDragOverPanel(null)}
          onDrop={handleDrop('available')}
          renderItem={(item) => {
            const grantable = isGrantable(item.code);
            return (
              <PermissionRow
                key={item.code}
                item={item}
                locked={!grantable}
                disabled={disabled}
                draggable={grantable && !disabled}
                onDragStart={() => setDragCode(item.code)}
                onActivate={() => grant(item.code)}
                icon={
                  grantable ? (
                    <ChevronRight className="size-4" aria-hidden />
                  ) : (
                    <Lock className="size-3.5" aria-hidden />
                  )
                }
                actionLabel={t.organizations.roles.grantAction}
              />
            );
          }}
        />

        <TransferPanel
          title={t.organizations.roles.grantedTitle}
          count={granted.length}
          groups={groupByResource(granted)}
          emptyLabel={t.organizations.roles.grantedEmpty}
          isDragOver={dragOverPanel === 'granted'}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOverPanel('granted');
          }}
          onDragLeave={() => setDragOverPanel(null)}
          onDrop={handleDrop('granted')}
          renderItem={(item) => (
            <PermissionRow
              key={item.code}
              item={item}
              locked={false}
              disabled={disabled}
              draggable={!disabled}
              onDragStart={() => setDragCode(item.code)}
              onActivate={() => revoke(item.code)}
              icon={<ChevronLeft className="size-4" aria-hidden />}
              actionLabel={t.organizations.roles.revokeAction}
              iconFirst
            />
          )}
        />
      </div>
    </div>
  );
}

function TransferPanel({
  title,
  count,
  groups,
  emptyLabel,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  renderItem,
}: Readonly<{
  title: string;
  count: number;
  groups: [string, TransferListPermission[]][];
  emptyLabel: string;
  isDragOver: boolean;
  onDragOver: (event: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent) => void;
  renderItem: (item: TransferListPermission) => React.ReactNode;
}>) {
  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        isDragOver ? 'border-primary bg-primary/5' : 'border-border'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-medium">{title}</span>
        <Badge variant="secondary">{count}</Badge>
      </div>
      <ScrollArea className="h-72">
        <div className="space-y-3 p-3">
          {groups.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">{emptyLabel}</p>
          ) : (
            groups.map(([resource, items]) => (
              <div key={resource} className="space-y-1">
                <p className="text-muted-foreground px-1 text-xs font-medium uppercase tracking-wide">
                  {resource}
                </p>
                <div className="space-y-0.5">{items.map(renderItem)}</div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function PermissionRow({
  item,
  locked,
  disabled,
  draggable,
  onDragStart,
  onActivate,
  icon,
  actionLabel,
  iconFirst = false,
}: Readonly<{
  item: TransferListPermission;
  locked: boolean;
  disabled: boolean;
  draggable: boolean;
  onDragStart: () => void;
  onActivate: () => void;
  icon: React.ReactNode;
  actionLabel: string;
  iconFirst?: boolean;
}>) {
  let rowStateCls = '';
  if (locked) {
    rowStateCls = 'text-muted-foreground cursor-not-allowed';
  } else if (draggable) {
    rowStateCls = 'hover:bg-muted cursor-grab active:cursor-grabbing';
  }

  const moveButton = (
    <button
      type="button"
      disabled={disabled}
      onClick={onActivate}
      aria-label={`${actionLabel}: ${item.label || item.code}`}
      className="text-muted-foreground hover:text-foreground shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
    >
      {icon}
    </button>
  );

  return (
    <div
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', item.code);
        event.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      title={locked ? t.organizations.roles.permissionLocked : undefined}
      className={cn(
        'group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
        rowStateCls
      )}
    >
      {iconFirst && !locked ? moveButton : null}

      <span className="min-w-0 flex-1 truncate">{item.label || item.code}</span>

      {!iconFirst && locked ? <span className="text-muted-foreground shrink-0">{icon}</span> : null}
      {!iconFirst && !locked ? moveButton : null}
    </div>
  );
}
