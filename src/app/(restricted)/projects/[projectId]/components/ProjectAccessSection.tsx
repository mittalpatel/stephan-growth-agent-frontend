'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Users, X } from 'lucide-react';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDate } from '@/lib/i18n';
import { t } from '@/locales';

import {
  useProjectAccess,
  type AccessLevelOrNone,
  type ProjectAccessRow,
} from '../../hooks/useProjectAccess';

/** Grantable levels — "No access" is never an option to *add* someone at, only
 *  something a row starts as before they're added, or ends at when removed. */
const GRANT_LEVELS: Exclude<AccessLevelOrNone, 'none'>[] = ['viewer', 'editor', 'manager'];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

function AccessSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

/**
 * A row for someone who already has a grant — avatar, name/email, a level
 * select (changing it re-grants at the new level rather than removing first),
 * and a remove button. This is the "people with access" list; it never shows
 * the rest of the org, unlike the previous full-roster-with-a-dropdown design.
 */

/**
 * The project's creator — pinned above the grant list with a fixed "Owner"
 * badge instead of a level select or remove button. Ownership isn't a
 * `ProjectAccess` row (Owner/Admin already bypass grant scoping entirely, see
 * `ProjectSelector`), so it can't be revoked from here, and offering to "add"
 * the owner as if they lacked access — or "remove" them — would both be lies.
 */
function OwnerRow({ fullName, email }: Readonly<{ fullName: string; email: string }>) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
      <Avatar size="sm">
        <AvatarFallback>{initials(fullName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{fullName}</p>
        <p className="text-muted-foreground truncate text-xs">{email}</p>
      </div>
      <Badge variant="secondary">{t.projects.access.ownerBadge}</Badge>
    </div>
  );
}

/**
 * Someone whose org role (Owner/Admin) already grants them every project.
 *
 * Pinned and non-removable for the same reason the project's own owner is:
 * their access does not come from a `ProjectAccess` grant, so "revoking" one
 * would remove a row from this list and change nothing about what they can
 * actually see. Showing a working-looking remove button for an access level
 * this dialog cannot control is the lie worth avoiding — the badge states the
 * real reason they have access instead.
 */
function OrgWideAccessRow({
  fullName,
  email,
  roleName,
}: Readonly<{ fullName: string; email: string; roleName: string | null }>) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
      <Avatar size="sm">
        <AvatarFallback>{initials(fullName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{fullName}</p>
        <p className="text-muted-foreground truncate text-xs">{email}</p>
      </div>
      <Badge variant="secondary" title={t.projects.access.orgWideAccessHint}>
        {roleName
          ? format(t.projects.access.orgWideBadge, { role: roleName })
          : t.projects.access.orgWideBadgeFallback}
      </Badge>
    </div>
  );
}

function AccessRow({
  row,
  pending,
  onChangeLevel,
  onRemove,
}: Readonly<{
  row: ProjectAccessRow;
  pending: boolean;
  onChangeLevel: (level: Exclude<AccessLevelOrNone, 'none'>) => void;
  onRemove: () => void;
}>) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
      <Avatar size="sm">
        <AvatarFallback>{initials(row.full_name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{row.full_name}</p>
        <p className="text-muted-foreground truncate text-xs">{row.email}</p>
      </div>
      <span className="text-muted-foreground hidden shrink-0 text-xs sm:inline">
        {row.granted_at ? formatDate(row.granted_at) : t.common.notAvailable}
      </span>
      <Select
        value={row.access_level === 'none' ? undefined : row.access_level}
        disabled={pending}
        onValueChange={(level) => onChangeLevel(level as Exclude<AccessLevelOrNone, 'none'>)}
      >
        <SelectTrigger
          className="w-[130px] shrink-0"
          aria-label={t.projects.access.columns.accessLevel}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GRANT_LEVELS.map((level) => (
            <SelectItem key={level} value={level}>
              {t.projects.access.levels[level]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={pending}
        aria-label={t.projects.access.removeAriaLabel}
        onClick={onRemove}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

/**
 * "Add people" — a search box over the org roster, scoped to members who do
 * not already have a grant, with a level picker next to the match so a level
 * is chosen before the grant is created rather than defaulted then corrected.
 *
 * Deliberately not a full member-list-with-a-dropdown (the previous design):
 * an org can have far more members than should ever see a given project, and
 * showing all of them by default is the opposite of what "sharing" means —
 * mirrors the add-then-list pattern of Google Docs' share dialog.
 */
/**
 * A chip for one person queued to be added, before the batch is submitted —
 * name plus a remove (x), same shape as a Google Docs share-dialog chip.
 */
function PendingChip({ row, onRemove }: Readonly<{ row: ProjectAccessRow; onRemove: () => void }>) {
  return (
    <span className="bg-muted flex items-center gap-1.5 rounded-full py-1 pr-1 pl-2 text-sm">
      <Avatar size="sm" className="size-5">
        <AvatarFallback className="text-[10px]">{initials(row.full_name)}</AvatarFallback>
      </Avatar>
      <span className="max-w-[12rem] truncate">{row.full_name}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t.projects.access.removeAriaLabel}
        className="hover:bg-accent rounded-full p-0.5"
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}

function AddPeople({
  candidates,
  onAdd,
}: Readonly<{
  candidates: ProjectAccessRow[];
  onAdd: (userIds: string[], level: Exclude<AccessLevelOrNone, 'none'>) => Promise<void>;
}>) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ProjectAccessRow[]>([]);
  const [level, setLevel] = useState<Exclude<AccessLevelOrNone, 'none'>>('viewer');
  const [isAdding, setIsAdding] = useState(false);

  const selectedIds = useMemo(() => new Set(selected.map((row) => row.user_id)), [selected]);
  const remainingCandidates = useMemo(
    () => candidates.filter((row) => !selectedIds.has(row.user_id)),
    [candidates, selectedIds]
  );

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool = needle
      ? remainingCandidates.filter(
          (row) =>
            row.full_name.toLowerCase().includes(needle) || row.email.toLowerCase().includes(needle)
        )
      : remainingCandidates;
    return pool.slice(0, 6);
  }, [remainingCandidates, query]);

  // Selecting a match adds it to the pending batch and keeps the popover open
  // and the input focused — Google Docs lets you keep typing to add the next
  // person rather than closing after every pick.
  const handleSelect = (row: ProjectAccessRow) => {
    setSelected((prev) => [...prev, row]);
    setQuery('');
  };

  const handleRemoveSelected = (userId: string) => {
    setSelected((prev) => prev.filter((row) => row.user_id !== userId));
  };

  const handleAdd = async () => {
    if (selected.length === 0) return;
    setIsAdding(true);
    try {
      await onAdd(
        selected.map((row) => row.user_id),
        level
      );
      setSelected([]);
      setQuery('');
      setOpen(false);
    } finally {
      setIsAdding(false);
    }
  };

  if (candidates.length === 0 && selected.length === 0) {
    return <p className="text-muted-foreground text-sm">{t.projects.access.everyoneAdded}</p>;
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((row) => (
            <PendingChip
              key={row.user_id}
              row={row}
              onRemove={() => handleRemoveSelected(row.user_id)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            {/* Radix's PopoverTrigger (built on Primitive.button) defaults its
                asChild target to `type="button"` so it never submits a form —
                harmless for an actual button, but it silently makes this
                Input un-typeable, since the DOM then rejects `.fill()`/typed
                input on a button-typed input. Override it back to text. */}
            <Input
              type="text"
              value={query}
              placeholder={t.projects.access.addPeoplePlaceholder}
              onFocus={() => setOpen(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              className="flex-1"
            />
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-1"
            align="start"
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            {matches.length === 0 ? (
              <p className="text-muted-foreground px-2 py-1.5 text-sm">
                {t.projects.access.noMatches}
              </p>
            ) : (
              <div className="flex flex-col">
                {matches.map((row) => (
                  <button
                    key={row.user_id}
                    type="button"
                    onClick={() => handleSelect(row)}
                    className="hover:bg-accent flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm"
                  >
                    <Avatar size="sm">
                      <AvatarFallback>{initials(row.full_name)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{row.full_name}</span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {row.email}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>

        <Select value={level} onValueChange={(value) => setLevel(value as typeof level)}>
          <SelectTrigger
            className="w-full sm:w-[130px]"
            aria-label={t.projects.access.columns.accessLevel}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRANT_LEVELS.map((option) => (
              <SelectItem key={option} value={option}>
                {t.projects.access.levels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="button" disabled={selected.length === 0 || isAdding} onClick={handleAdd}>
          {t.projects.access.addButton}
          {selected.length > 1 ? ` (${selected.length})` : ''}
        </Button>
      </div>
    </div>
  );
}

/**
 * Who has access to this project — Google-Docs-style sharing, opened from a
 * "Share" button as a dialog rather than living as a permanent page section.
 * Gated on `project:access_manage`: someone without it never sees the Share
 * trigger at all, because who can see the grant list is itself part of what
 * that permission controls.
 */
export function ProjectAccessSection({
  projectId,
  ownerEmail,
}: Readonly<{ projectId: string; ownerEmail: string }>) {
  const { can } = usePermissions();
  const canManageAccess = can('project', 'access_manage');
  const [open, setOpen] = useState(false);

  const {
    rows,
    isLoading,
    isError,
    pendingUserId,
    grantAccess,
    updateAccessLevel,
    revokeAccess,
    refetch,
  } = useProjectAccess(projectId);

  if (!canManageAccess) return null;

  // The owner already sees and manages the project by virtue of owning it —
  // not through a `ProjectAccess` grant — so they're pinned separately below
  // rather than appearing as an ordinary "no access yet" candidate to add, or
  // an ordinary grant someone could revoke.
  const owner = ownerEmail ? rows.find((row) => row.email === ownerEmail) : undefined;
  const withoutOwner = owner ? rows.filter((row) => row.user_id !== owner.user_id) : rows;

  // Owner/Admin-role members see every project in the organization regardless of
  // grants (`ProjectSelector` bypasses grant scoping for them), so they are
  // pinned like the project owner rather than offered as people to add or
  // remove — a grant for them is unnecessary and a revoke is a silent no-op.
  const orgWide = withoutOwner.filter((row) => row.has_org_wide_access);
  const grantScoped = withoutOwner.filter((row) => !row.has_org_wide_access);
  const granted = grantScoped.filter((row) => row.access_level !== 'none');
  const candidates = grantScoped.filter((row) => row.access_level === 'none');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Users className="size-4" aria-hidden />
          {t.projects.access.shareButton}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.projects.access.title}</DialogTitle>
          <DialogDescription>{t.projects.access.description}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <AccessSkeleton />
        ) : isError ? (
          <EmptyState
            icon={AlertTriangle}
            title={t.projects.access.errorTitle}
            description={t.projects.access.errorDescription}
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                {t.buttons.tryAgain}
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <AddPeople
              candidates={candidates}
              onAdd={async (userIds, level) => {
                // Sequential, not Promise.all: each grantAccess call refetches
                // the access list, and firing them concurrently would let two
                // refetches race and overwrite each other's toast/error state.
                for (const userId of userIds) {
                  await grantAccess(userId, level);
                }
              }}
            />

            <div className="space-y-2">
              <h3 className="text-muted-foreground text-sm font-medium">
                {t.projects.access.peopleWithAccessTitle}
              </h3>
              {!owner && orgWide.length === 0 && granted.length === 0 ? (
                <EmptyState
                  title={t.projects.access.emptyTitle}
                  description={t.projects.access.emptyDescription}
                />
              ) : (
                <div className="max-h-[50vh] space-y-2 overflow-y-auto">
                  {owner && <OwnerRow fullName={owner.full_name} email={owner.email} />}
                  {orgWide.map((row) => (
                    <OrgWideAccessRow
                      key={row.user_id}
                      fullName={row.full_name}
                      email={row.email}
                      roleName={row.role_name}
                    />
                  ))}
                  {granted.map((row) => (
                    <AccessRow
                      key={row.user_id}
                      row={row}
                      pending={pendingUserId === row.user_id}
                      onChangeLevel={(level) => void updateAccessLevel(row.user_id, level)}
                      onRemove={() => void revokeAccess(row.user_id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
