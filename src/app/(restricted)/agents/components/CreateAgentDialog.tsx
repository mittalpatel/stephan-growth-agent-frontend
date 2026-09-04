'use client';

import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { Plus } from 'lucide-react';

import { useCreateAgentForm } from '../hooks/useCreateAgentForm';
import type { AgentCreateFormValues } from '@/lib/schemas/agent';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RHFTextField } from '@/components/common/form';
import { t } from '@/locales';

type Props = Readonly<{
  onCreated: () => void;
}>;

/** "New agent" — mirrors `CreateProjectDialog`'s shape. */
export default function CreateAgentDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const { form, isPending, submit } = useCreateAgentForm({
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
          {t.agents.actions.create}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.agents.form.createTitle}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={submit} className="space-y-4">
            <RHFTextField<AgentCreateFormValues>
              name="name"
              label={t.agents.form.nameLabel}
              placeholder={t.agents.form.namePlaceholder}
              required
            />
            <RHFTextField<AgentCreateFormValues>
              name="human_inbox_email"
              label={t.agents.form.inboxEmailLabel}
              placeholder={t.agents.form.inboxEmailPlaceholder}
              type="email"
              required
            />
            <RHFTextField<AgentCreateFormValues>
              name="default_language"
              label={t.agents.form.defaultLanguageLabel}
              placeholder={t.agents.form.defaultLanguagePlaceholder}
              required
            />
            <RHFTextField<AgentCreateFormValues>
              name="enabled_languages_input"
              label={t.agents.form.enabledLanguagesLabel}
              placeholder={t.agents.form.enabledLanguagesPlaceholder}
              required
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {t.agents.form.createTitle}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
