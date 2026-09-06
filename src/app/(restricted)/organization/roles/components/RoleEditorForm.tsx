'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Info, RotateCcw, Trash2 } from 'lucide-react';
import PermissionTransferList from '@/components/common/PermissionTransferList';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fieldLabelCls } from '@/components/common/form';
import { format, plural } from '@/lib/i18n';
import { t } from '@/locales';
import type { CatalogPermission, OrganizationRole } from '../types';

const ROLES_LIST_PATH = '/organization/roles';

type Props = Readonly<{
  /** `undefined` puts the form in create mode. */
  role?: OrganizationRole;
  catalog: CatalogPermission[];
  isGrantable: (code: string) => boolean;
  isSubmitting: boolean;
  onSubmit: (body: { name: string; description: string }, codes: string[]) => Promise<boolean>;
  onReset?: () => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
}>;

/**
 * The role editor, shared by `/organization/roles/new` and
 * `/organization/roles/[roleId]`. One form for both so the create and edit
 * experiences cannot drift apart — which is exactly what had happened before,
 * when creation had a dialog and editing had nothing at all.
 *
 * A full page rather than a drawer: a permission picker with two panels, search,
 * and a couple of hundred rows needs the width, and an editor deep-linkable by
 * URL is one someone can bookmark, share, or land on from the breadcrumb.
 */
export default function RoleEditorForm({
  role,
  catalog,
  isGrantable,
  isSubmitting,
  onSubmit,
  onReset,
  onDelete,
}: Props) {
  const isCreate = role === undefined;

  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [selected, setSelected] = useState<string[]>(role?.permissions ?? []);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const submit = async () => {
    await onSubmit({ name: name.trim(), description: description.trim() }, selected);
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href={ROLES_LIST_PATH}>
            <ChevronLeft className="size-4" aria-hidden />
            {t.organizations.roles.backToList}
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight break-words">
                {isCreate
                  ? t.organizations.roles.createTitle
                  : format(t.organizations.roles.editTitle, { name: role.name })}
              </h1>
              {role ? (
                <Badge variant={role.is_system ? 'secondary' : 'outline'}>
                  {role.is_system
                    ? t.organizations.roles.systemBadge
                    : t.organizations.roles.customBadge}
                </Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {t.organizations.roles.editDescription}
            </p>
          </div>

          <div className="flex gap-2">
            {role?.is_system && onReset ? (
              <Button
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setConfirmingReset(true)}
              >
                <RotateCcw className="size-4" aria-hidden />
                {t.organizations.roles.resetAction}
              </Button>
            ) : null}
            {role && !role.is_system && onDelete ? (
              <Button
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                {t.organizations.roles.deleteAction}
              </Button>
            ) : null}
            <Button disabled={isSubmitting || name.trim() === ''} onClick={() => void submit()}>
              {t.buttons.save}
            </Button>
          </div>
        </div>
      </div>

      {role?.is_system ? (
        <div className="bg-warning text-warning-foreground flex gap-3 rounded-md p-4">
          <Info className="h-5 w-5 shrink-0" aria-hidden />
          <p className="text-sm">{t.organizations.roles.systemEditNotice}</p>
        </div>
      ) : null}

      <div className="bg-card grid gap-4 rounded-lg border p-6 sm:grid-cols-2">
        <div>
          <Label className={fieldLabelCls} htmlFor="role-name">
            {t.organizations.roles.nameLabel}
          </Label>
          <Input
            id="role-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t.organizations.roles.namePlaceholder}
          />
        </div>
        <div>
          <Label className={fieldLabelCls} htmlFor="role-description">
            {t.organizations.roles.descriptionLabel}
          </Label>
          <Input
            id="role-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t.organizations.roles.descriptionPlaceholder}
          />
        </div>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">{t.organizations.roles.permissionsLabel}</h2>
          <span className="text-muted-foreground text-xs">
            {plural(selected.length, t.organizations.roles.permissionCount, {
              count: selected.length,
            })}
          </span>
        </div>
        <PermissionTransferList
          catalog={catalog}
          selected={selected}
          onChange={setSelected}
          isGrantable={isGrantable}
          disabled={isSubmitting}
        />
      </section>

      {role && onReset ? (
        <ConfirmDialog
          open={confirmingReset}
          title={format(t.organizations.roles.resetConfirmTitle, { name: role.name })}
          message={t.organizations.roles.resetConfirmBody}
          loading={isSubmitting}
          onConfirm={() => {
            setConfirmingReset(false);
            void onReset();
          }}
          onOpenChange={setConfirmingReset}
        />
      ) : null}

      {role && onDelete ? (
        <ConfirmDialog
          open={confirmingDelete}
          destructive
          title={format(t.organizations.roles.deleteConfirmTitle, { name: role.name })}
          message={t.organizations.roles.deleteConfirmBody}
          loading={isSubmitting}
          onConfirm={() => {
            setConfirmingDelete(false);
            void onDelete();
          }}
          onOpenChange={setConfirmingDelete}
        />
      ) : null}
    </div>
  );
}
