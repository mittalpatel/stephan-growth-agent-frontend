'use client';

import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RHFTextField } from '@/components/common/form';
import { applyApiError } from '@/lib/apiError';
import {
  knowledgeSourceRenameSchema,
  type KnowledgeSourceRenameFormValues,
} from '@/lib/schemas/knowledge';
import { t } from '@/locales';
import type { KnowledgeSourceListItem } from '@/types/knowledge';

import { useKnowledgeSourceActions } from '../hooks/useKnowledgeSourceActions';

type Props = Readonly<{
  agentId: string;
  source: KnowledgeSourceListItem | null;
  onOpenChange: (open: boolean) => void;
}>;

export function RenameSourceDialog({ agentId, source, onOpenChange }: Props) {
  const { rename, isRenaming } = useKnowledgeSourceActions(agentId);

  const form = useForm<KnowledgeSourceRenameFormValues>({
    resolver: zodResolver(knowledgeSourceRenameSchema),
    defaultValues: { display_name: source?.display_name ?? '' },
  });

  useEffect(() => {
    if (source) form.reset({ display_name: source.display_name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.id]);

  const submit = form.handleSubmit(async (values) => {
    if (!source) return;
    try {
      await rename(source.id, values);
      onOpenChange(false);
    } catch (error) {
      applyApiError<KnowledgeSourceRenameFormValues>(error, {
        setError: form.setError,
        fields: ['display_name'],
      });
    }
  });

  return (
    <Dialog open={Boolean(source)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.knowledge.rename.title}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={submit} className="space-y-4">
            <RHFTextField<KnowledgeSourceRenameFormValues>
              name="display_name"
              label={t.knowledge.rename.nameLabel}
              required
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t.knowledge.rename.cancel}
              </Button>
              <Button type="submit" disabled={isRenaming}>
                {t.knowledge.rename.save}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
