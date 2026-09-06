'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { applyApiError } from '@/lib/apiError';
import { RHFTextareaField } from '@/components/common/form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { approvalRejectSchema, type ApprovalRejectFormValues } from '@/lib/schemas/approval';
import { t } from '@/locales';

type Props = Readonly<{
  onReject: (reason: string) => Promise<unknown>;
  isRejecting: boolean;
}>;

export function RejectApprovalDialog({ onReject, isRejecting }: Props) {
  const [open, setOpen] = useState(false);
  const form = useForm<ApprovalRejectFormValues>({
    resolver: zodResolver(approvalRejectSchema),
    defaultValues: { rejection_reason: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await onReject(values.rejection_reason);
      setOpen(false);
      form.reset();
    } catch (error) {
      applyApiError(error);
    }
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
        <Button variant="outline">{t.approvals.actions.reject}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.approvals.reject.title}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={submit} className="space-y-4">
            <RHFTextareaField<ApprovalRejectFormValues>
              name="rejection_reason"
              label={t.approvals.reject.reasonLabel}
              placeholder={t.approvals.reject.reasonPlaceholder}
              required
            />
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={isRejecting}>
                {t.approvals.actions.reject}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
