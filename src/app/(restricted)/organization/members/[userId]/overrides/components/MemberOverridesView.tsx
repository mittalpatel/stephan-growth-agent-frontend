'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Lock, Search } from 'lucide-react';
import { useMemberOverrides } from '../../../../hooks/useMemberOverrides';
import { useOrganizationMembers } from '../../../../hooks/useOrganizationMembers';
import { usePermissionCatalog } from '../../../../hooks/usePermissionCatalog';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import type { CatalogPermission } from '../../../../roles/types';
import type { OverrideEffect, PermissionExplanation } from '@/services/organizations';
import {
  userPermissionsExplainEndpoint,
  userPermissionsExplainKey,
} from '@/services/organizations';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { format, formatDateTime } from '@/lib/i18n';
import { t } from '@/locales';

const MEMBERS_LIST_PATH = '/organization/members';

// A date is required for an expiry to apply at all; the time is optional and
// defaults to end-of-day, so "expires on the 12th" still works without
// forcing every caller to also pick a time.
//
// Built via local Date components (not a bare template string) and sent as
// `.toISOString()` — the backend runs with TIME_ZONE="UTC", so a naive
// "2026-08-20T18:53:00" gets stored as 18:53 UTC, not 18:53 in the browser's
// timezone, silently shifting the expiry by the browser's UTC offset.
// `toISOString()` always encodes the correct absolute instant regardless of
// the server's default timezone.
function toExpiryIso(dateValue: string, timeValue: string): string | null {
  if (!dateValue) return null;
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hours, minutes] = (timeValue || '23:59').split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0).toISOString();
}

// Local calendar date, not `.toISOString().slice(0, 10)` — that reads the
// UTC date, which is a day ahead of local "today" for any timezone east of
// UTC in the hours after local midnight (e.g. IST between 12am-5:30am).
function todayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// An expiry picked for "today" has to still be in the future — otherwise the
// override is dead on arrival. Five minutes of buffer covers the time it
// takes to actually click Confirm.
function minTimeForToday(): string {
  const withBuffer = new Date(Date.now() + 5 * 60 * 1000);
  return withBuffer.toTimeString().slice(0, 5);
}

export default function MemberOverridesView({ userId }: Readonly<{ userId: string }>) {
  const { members, isLoading: isMembersLoading } = useOrganizationMembers();
  const member = members.find((row) => row.user_id === userId);

  if (isMembersLoading) return <Skeleton className="h-64 w-full" />;

  if (!member) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title={t.organizations.overrides.notFoundTitle}
        description={t.organizations.overrides.notFoundDescription}
        action={
          <Button variant="outline" asChild>
            <Link href={MEMBERS_LIST_PATH}>{t.organizations.overrides.backToMembers}</Link>
          </Button>
        }
      />
    );
  }

  const memberName = member.full_name || member.email;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={MEMBERS_LIST_PATH}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          {t.organizations.overrides.backToMembers}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {format(t.organizations.overrides.titleFor, { name: memberName })}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t.organizations.overrides.description}
        </p>
      </div>

      <OverridesEditor userId={userId} />
    </div>
  );
}

function OverridesEditor({ userId }: Readonly<{ userId: string }>) {
  const {
    overrides,
    isLoading: isOverridesLoading,
    isSubmitting,
    grant,
    remove,
  } = useMemberOverrides(userId);
  const { catalog, isGrantable, isCatalogLoading } = usePermissionCatalog();
  const [pendingAction, setPendingAction] = useState<{
    code: string;
    label: string;
    effect: OverrideEffect;
  } | null>(null);

  const explainQuery = useAuthQuery<{ data: PermissionExplanation }>(
    userPermissionsExplainKey(userId),
    userPermissionsExplainEndpoint(userId)
  );
  const explanationData = explainQuery.data?.data;

  // Three facts, each read straight from the backend's own computation rather
  // than re-derived: what the member's role(s) grant on their own, what an
  // override currently grants, and what an override currently blocks. A code
  // can appear in `roleGranted` and `denied` at once — that combination *is*
  // "the role would allow this, but it's blocked" — which is exactly the case
  // this page most needs to make legible.
  const roleGrantedCodes = useMemo(
    () =>
      new Set(
        Object.entries(explanationData ?? {})
          .filter(([, sources]) => sources.some((source) => source.kind !== 'override'))
          .map(([code]) => code)
      ),
    [explanationData]
  );
  const effectiveCodes = useMemo(
    () => new Set(Object.keys(explanationData ?? {})),
    [explanationData]
  );
  const deniedCodes = useMemo(
    () =>
      new Set(overrides.filter((row) => row.effect === 'deny').map((row) => row.permission_code)),
    [overrides]
  );
  const overridesByCode = useMemo(
    () => new Map(overrides.map((row) => [row.permission_code, row])),
    [overrides]
  );

  const isLoading = isOverridesLoading || isCatalogLoading || explainQuery.isLoading;
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const currentAccess = catalog
    .filter((perm) => effectiveCodes.has(perm.code))
    .sort((a, b) => (a.label || a.code).localeCompare(b.label || b.code));

  const notGranted = catalog
    .filter((perm) => !effectiveCodes.has(perm.code))
    .sort((a, b) => (a.label || a.code).localeCompare(b.label || b.code));

  return (
    <div className="space-y-6">
      <section className="bg-card rounded-lg border">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold">{t.organizations.overrides.currentAccessTitle}</h2>
          <p className="text-muted-foreground text-sm">
            {t.organizations.overrides.currentAccessDescription}
          </p>
        </div>
        <div className="divide-y divide-border">
          {currentAccess.length === 0 ? (
            <p className="text-muted-foreground p-4 text-sm">
              {t.organizations.overrides.currentAccessEmpty}
            </p>
          ) : (
            currentAccess.map((perm) => (
              <CurrentAccessRow
                key={perm.code}
                permission={perm}
                viaRole={roleGrantedCodes.has(perm.code)}
                expiresAtValue={overridesByCode.get(perm.code)?.expires_at ?? null}
                disabled={isSubmitting}
                onDeny={() =>
                  setPendingAction({
                    code: perm.code,
                    label: perm.label || perm.code,
                    effect: 'deny',
                  })
                }
                onRemoveOverride={() => void remove(perm.code)}
              />
            ))
          )}
        </div>
      </section>

      <PermissionPicker
        permissions={notGranted}
        deniedCodes={deniedCodes}
        isGrantable={isGrantable}
        disabled={isSubmitting}
        onGrant={(code) => {
          const label = notGranted.find((perm) => perm.code === code)?.label || code;
          setPendingAction({ code, label, effect: 'grant' });
        }}
        onRemoveDenial={(code) => void remove(code)}
      />

      <OverrideActionDialog
        action={pendingAction}
        loading={isSubmitting}
        onConfirm={(expiresDate, expiresTime) => {
          if (pendingAction) {
            void grant(
              pendingAction.code,
              pendingAction.effect,
              '',
              toExpiryIso(expiresDate, expiresTime)
            );
          }
          setPendingAction(null);
        }}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      />
    </div>
  );
}

/**
 * Confirms a single grant/deny with an expiry field scoped to that one
 * permission — an override is per (member, permission), so the expiry has
 * to be set at the same granularity, not shared across the whole page.
 */
type PendingOverrideAction = { code: string; label: string; effect: OverrideEffect };

function OverrideActionDialog({
  action,
  loading,
  onConfirm,
  onOpenChange,
}: Readonly<{
  action: PendingOverrideAction | null;
  loading: boolean;
  onConfirm: (expiresDate: string, expiresTime: string) => void;
  onOpenChange: (open: boolean) => void;
}>) {
  return (
    <Dialog open={action !== null} onOpenChange={onOpenChange}>
      {action ? (
        // Keyed by the action so a fresh instance (and a blank expiry field)
        // mounts every time a different permission's dialog opens.
        <OverrideActionDialogBody
          key={`${action.code}:${action.effect}`}
          action={action}
          loading={loading}
          onConfirm={onConfirm}
          onCancel={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
}

function OverrideActionDialogBody({
  action,
  loading,
  onConfirm,
  onCancel,
}: Readonly<{
  action: PendingOverrideAction;
  loading: boolean;
  onConfirm: (expiresDate: string, expiresTime: string) => void;
  onCancel: () => void;
}>) {
  const [expiresDate, setExpiresDate] = useState('');
  const [expiresTime, setExpiresTime] = useState('');
  const isDeny = action.effect === 'deny';

  const isToday = expiresDate === todayDateStr();
  const minTime = isToday ? minTimeForToday() : undefined;
  const timeTooSoon =
    isToday && expiresTime !== '' && minTime !== undefined && expiresTime < minTime;

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {format(
            isDeny
              ? t.organizations.overrides.denyConfirmTitle
              : t.organizations.overrides.grantConfirmTitle,
            { permission: action.label }
          )}
        </DialogTitle>
      </DialogHeader>
      <p className="text-muted-foreground text-sm">
        {isDeny
          ? t.organizations.overrides.denyConfirmBody
          : t.organizations.overrides.grantConfirmBody}
      </p>
      <div>
        <Label htmlFor="override-action-expiry-date" className="text-sm">
          {t.organizations.overrides.expiresLabel}
        </Label>
        <div className="mt-1 flex gap-2">
          <Input
            id="override-action-expiry-date"
            type="date"
            value={expiresDate}
            min={todayDateStr()}
            onChange={(event) => setExpiresDate(event.target.value)}
            placeholder={t.organizations.overrides.expiresPlaceholder}
            className="w-40"
          />
          <Input
            id="override-action-expiry-time"
            type="time"
            value={expiresTime}
            min={minTime}
            onChange={(event) => setExpiresTime(event.target.value)}
            disabled={!expiresDate}
            aria-label={t.organizations.overrides.expiresTimeLabel}
            className="w-32"
          />
        </div>
        <p
          className={
            timeTooSoon ? 'text-destructive mt-1 text-sm' : 'text-muted-foreground mt-1 text-sm'
          }
        >
          {timeTooSoon
            ? t.organizations.overrides.expiresTimeTooSoon
            : expiresDate
              ? t.organizations.overrides.expiresTimeHint
              : t.organizations.overrides.expiresHint}
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          {t.buttons.cancel}
        </Button>
        <Button
          variant={isDeny ? 'destructive' : 'default'}
          onClick={() => onConfirm(expiresDate, expiresTime)}
          disabled={loading || timeTooSoon}
        >
          {loading && <Spinner />}
          {isDeny ? t.organizations.overrides.denyAction : t.organizations.overrides.grantAction}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/** One permission the member currently has, and the single action that changes it. */
function CurrentAccessRow({
  permission,
  viaRole,
  expiresAtValue,
  disabled,
  onDeny,
  onRemoveOverride,
}: Readonly<{
  permission: CatalogPermission;
  viaRole: boolean;
  expiresAtValue: string | null;
  disabled: boolean;
  onDeny: () => void;
  onRemoveOverride: () => void;
}>) {
  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{permission.label || permission.code}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">
            {viaRole
              ? t.organizations.overrides.sourceRole
              : t.organizations.overrides.sourceOverride}
          </Badge>
          {expiresAtValue ? (
            <Badge variant="outline">
              {format(t.organizations.overrides.expiresBadge, {
                date: formatDateTime(expiresAtValue),
              })}
            </Badge>
          ) : null}
        </div>
      </div>
      {viaRole ? (
        <Button variant="outline" size="sm" disabled={disabled} onClick={onDeny}>
          {t.organizations.overrides.denyAction}
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled={disabled} onClick={onRemoveOverride}>
          {t.organizations.overrides.removeOverrideAction}
        </Button>
      )}
    </div>
  );
}

/** Everything the member does not currently have — grant one, or undo an
 * existing denial (which also lives here: a denied code is, by definition,
 * not currently granted). */
function PermissionPicker({
  permissions,
  deniedCodes,
  isGrantable,
  disabled,
  onGrant,
  onRemoveDenial,
}: Readonly<{
  permissions: CatalogPermission[];
  deniedCodes: Set<string>;
  isGrantable: (code: string) => boolean;
  disabled: boolean;
  onGrant: (code: string) => void;
  onRemoveDenial: (code: string) => void;
}>) {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const filtered = permissions.filter(
    (perm) =>
      query === '' ||
      perm.code.toLowerCase().includes(query) ||
      perm.label.toLowerCase().includes(query)
  );

  return (
    <section className="bg-card rounded-lg border">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold">{t.organizations.overrides.grantMoreTitle}</h2>
        <p className="text-muted-foreground text-sm">
          {t.organizations.overrides.grantMoreDescription}
        </p>
        <div className="relative mt-3">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.organizations.roles.searchPlaceholder}
            className="pl-8"
            aria-label={t.organizations.roles.searchPlaceholder}
          />
        </div>
      </div>
      <div className="divide-y divide-border">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground p-4 text-sm">
            {t.organizations.roles.availableEmpty}
          </p>
        ) : (
          filtered.map((perm) => {
            const denied = deniedCodes.has(perm.code);
            const grantable = isGrantable(perm.code);
            return (
              <div key={perm.code} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{perm.label || perm.code}</p>
                  {denied ? (
                    <Badge variant="destructive" className="mt-1">
                      {t.organizations.overrides.deniedBadge}
                    </Badge>
                  ) : null}
                </div>
                {denied ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => onRemoveDenial(perm.code)}
                  >
                    {t.organizations.overrides.removeDenialAction}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled || !grantable}
                    title={!grantable ? t.organizations.overrides.permissionLocked : undefined}
                    onClick={() => onGrant(perm.code)}
                  >
                    {!grantable ? <Lock className="size-3.5" aria-hidden /> : null}
                    {t.organizations.overrides.grantAction}
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
