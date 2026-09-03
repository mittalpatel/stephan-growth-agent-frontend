'use client';

import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { Plus } from 'lucide-react';

import { useCreateProjectForm } from '../hooks/useCreateProjectForm';
import type { ProjectFormValues } from '@/lib/schemas/project';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RHFSelectField, RHFTextField } from '@/components/common/form';
import { t } from '@/locales';

type Props = Readonly<{
  onCreated: () => void;
}>;

/**
 * "New project" — mirrors `InviteMemberDialog`'s shape: a controlled `Dialog`
 * whose trigger is the button, `useAuthMutation` for the POST, `applyApiError`
 * bound to the exact field names `projectSchema` shares with the backend
 * serializer, and a refetch on success rather than an optimistic cache write.
 */
export default function CreateProjectDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const { form, isPending, submit } = useCreateProjectForm({
    onSuccess: () => {
      setOpen(false);
      onCreated();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" aria-hidden />
          {t.projects.actions.create}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.projects.form.createTitle}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={submit} className="space-y-4">
            <RHFTextField<ProjectFormValues>
              name="name"
              label={t.projects.form.nameLabel}
              placeholder={t.projects.form.namePlaceholder}
              required
            />
            <RHFTextField<ProjectFormValues>
              name="description"
              label={t.projects.form.descriptionLabel}
              placeholder={t.projects.form.descriptionPlaceholder}
            />
            <RHFSelectField<ProjectFormValues>
              name="status"
              label={t.projects.form.statusLabel}
              options={[
                { label: t.projects.status.draft, value: 'draft' },
                { label: t.projects.status.active, value: 'active' },
                { label: t.projects.status.archived, value: 'archived' },
              ]}
              required
            />
            <RHFSelectField<ProjectFormValues>
              name="category"
              label={t.projects.form.categoryLabel}
              options={[
                { label: t.projects.category.standard, value: 'standard' },
                { label: t.projects.category.premium, value: 'premium' },
                { label: t.projects.category.legacy, value: 'legacy' },
              ]}
              required
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {t.projects.form.createTitle}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
