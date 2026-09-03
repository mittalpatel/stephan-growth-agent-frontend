'use client';

import Link from 'next/link';
import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import type { PermissionExplanation } from '@/services/organizations';
import {
  userPermissionsExplainEndpoint,
  userPermissionsExplainKey,
} from '@/services/organizations';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { format } from '@/lib/i18n';
import { t } from '@/locales';

type Props = Readonly<{
  userId: string | null;
  userName: string;
  onOpenChange: (open: boolean) => void;
}>;

/**
 * "Why does this user have X?" — read-only, straight from the backend's
 * `PermissionResolver.explain()`, so the source shown here is the source that
 * actually decided access, not a client-side re-derivation of the same rules.
 *
 * *Changing* what a member has access to (per-permission overrides) is a
 * separate full page (`/organization/members/[userId]/overrides`), linked
 * from the footer here — not built into this sheet. A grant/deny form plus a
 * permission picker doesn't fit a sidebar without the list above it becoming
 * unreadable, and this repo's own convention (the role editor) already moved
 * away from sheets for exactly that reason.
 */
export default function PermissionInspectorSheet({ userId, userName, onOpenChange }: Props) {
  const { can } = usePermissions();
  // The gate that actually matters here is `rbac:manage` — the permission the
  // override endpoints themselves require — not `member:manage`, which the
  // rest of this page uses for adding/removing members. The two are usually
  // held together, but the footer link should track its own endpoint's rule.
  const canManageOverrides = can('rbac', 'manage');

  const { data, isLoading, isError } = useAuthQuery<{ data: PermissionExplanation }>(
    userPermissionsExplainKey(userId ?? ''),
    userPermissionsExplainEndpoint(userId ?? ''),
    { enabled: Boolean(userId) }
  );

  const explanation = data?.data ?? {};
  const codes = Object.keys(explanation).sort();

  return (
    <Sheet open={userId !== null} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{format(t.organizations.explain.title, { name: userName })}</SheetTitle>
          <SheetDescription>{t.organizations.explain.description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">…</p>
          ) : isError ? (
            <p className="text-destructive text-sm">{t.organizations.explain.loadFailed}</p>
          ) : codes.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t.organizations.explain.empty}</p>
          ) : (
            <ul className="space-y-3">
              {codes.map((code) => (
                <li key={code} className="text-sm">
                  <p className="font-mono font-medium">{code}</p>
                  <ul className="text-muted-foreground ml-4 list-disc">
                    {explanation[code].map((source) => (
                      <li
                        key={`${code}:${source.kind}:${'role_slug' in source ? source.role_slug : ''}`}
                      >
                        {source.kind === 'role'
                          ? format(t.organizations.explain.sourceRole, { role: source.role_name })
                          : source.kind === 'override'
                            ? t.organizations.explain.sourceOverride
                            : t.organizations.explain.sourceSuperuser}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        {canManageOverrides && userId ? (
          <SheetFooter>
            <Button variant="outline" asChild>
              <Link href={`/organization/members/${userId}/overrides`}>
                {t.organizations.overrides.manageLink}
              </Link>
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
