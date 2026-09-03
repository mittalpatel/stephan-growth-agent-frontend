'use client';

import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { KeyRound } from 'lucide-react';

import { useCreateApiKeyForm, type ApiKeyFormValues } from '../hooks/useCreateApiKeyForm';
import type { ApiKeyCreateResponse } from '@/services/apiKeys';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RHFTextField } from '@/components/common/form';
import PermissionTransferList from '@/components/common/PermissionTransferList';
import { t } from '@/locales';

const copy = t.organizations.apiKeys.create;

type Props = Readonly<{
  onCreated: (key: ApiKeyCreateResponse) => void;
}>;

/**
 * Creates an API key and hands the response — secret included — to the parent.
 * Pure presenter: `useCreateApiKeyForm` owns the mutation, catalog filtering,
 * and request-body mapping.
 */
export default function CreateApiKeyDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const { form, isPending, submit, isCatalogLoading, grantableCatalog, selectedCodes } =
    useCreateApiKeyForm({
      onCreated: (key) => {
        setOpen(false);
        onCreated(key);
      },
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <KeyRound className="size-4" aria-hidden />
          {copy.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={submit} className="space-y-4">
            <RHFTextField<ApiKeyFormValues>
              name="name"
              label={copy.nameLabel}
              placeholder={copy.namePlaceholder}
              required
            />

            <div>
              <p className="mb-1 text-sm font-medium">{copy.permissionsLabel}</p>
              <p className="text-muted-foreground mb-2 text-xs">{copy.permissionsHelp}</p>
              {isCatalogLoading ? null : (
                <PermissionTransferList
                  catalog={grantableCatalog}
                  selected={selectedCodes}
                  onChange={(codes) => form.setValue('permission_codes', codes)}
                  isGrantable={() => true}
                  disabled={isPending}
                />
              )}
              {form.formState.errors.permission_codes ? (
                <p className="text-destructive mt-1 text-xs">
                  {form.formState.errors.permission_codes.message}
                </p>
              ) : null}
            </div>

            <RHFTextField<ApiKeyFormValues>
              name="expires_at"
              type="datetime-local"
              label={copy.expiresLabel}
            />
            <p className="text-muted-foreground -mt-2 text-xs">{copy.expiresHelp}</p>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? copy.submitting : copy.submit}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
