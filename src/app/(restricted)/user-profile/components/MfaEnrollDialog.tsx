'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { OtpInput } from '@/components/ui/otp-input';
import { t } from '@/locales';
import type { MfaEnrollResponse } from '@/services/mfa';

const copy = t.userProfile.mfa;

const confirmSchema = z.object({
  token: z.string().trim().min(6).max(6),
});
type ConfirmFormValues = z.infer<typeof confirmSchema>;

type Props = Readonly<{
  enrollment: MfaEnrollResponse | null;
  isConfirming: boolean;
  onConfirm: (token: string) => Promise<boolean>;
  onCancel: () => void;
}>;

/**
 * Enrollment QR + confirm code entry. `enrollment` (the secret/QR) lives only
 * in `useMfa`'s in-memory state — never in the TanStack cache, a query key,
 * or the URL — same reveal-once discipline as `RevealSecretDialog` for API
 * keys: no endpoint here can return the raw secret a second time either.
 */
export default function MfaEnrollDialog({
  enrollment,
  isConfirming,
  onConfirm,
  onCancel,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ConfirmFormValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { token: '' },
  });
  // Not `form.watch('token')`: `watch()` is a plain function React Hook Form
  // returns from `useForm()`, not itself memoizable, so passing its call
  // result straight into JSX defeats the React Compiler's memoization for
  // this component. `useWatch` is the hook form of the same subscription and
  // compiles cleanly.
  const token = useWatch({ control: form.control, name: 'token' });

  async function onSubmit(values: ConfirmFormValues) {
    setError(null);
    const ok = await onConfirm(values.token.trim());
    // Cleared on failure too, not just success: leaving the wrong digits in
    // place means a user retyping without first backspacing through all six
    // boxes relies on `OtpInput` correctly overwriting an already-filled
    // box, which is exactly the scenario `otp-input.tsx`'s `maxLength` fix
    // was needed for. Resetting here removes the need to rely on that at
    // all -- the boxes are simply empty and ready for a fresh attempt.
    form.reset();
    if (!ok) {
      setError(copy.invalidCode);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      form.reset();
      setError(null);
      onCancel();
    }
  }

  return (
    <Dialog open={Boolean(enrollment)} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{copy.enrollDialogTitle}</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-sm">{copy.enrollDialogInstructions}</p>

        {enrollment && (
          <div className="flex flex-col items-center gap-3">
            {/* Backend-generated data: URI (base64 SVG), never raw markup —
                see apps/users/services/mfa_service.py:_qrcode_data_uri. A data
                URI can't be optimized by next/image, so a plain <img> is the
                correct element here, not a workaround. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={enrollment.qrcode_data_uri}
              alt={copy.enrollDialogTitle}
              className="border-border h-48 w-48 rounded-md border p-2"
            />
            <div className="w-full space-y-1">
              <p className="text-muted-foreground text-xs font-medium">
                {copy.manualEntryLabel}
              </p>
              <code className="bg-muted block overflow-x-auto rounded-md p-2 text-sm break-all select-all">
                {enrollment.secret}
              </code>
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="mfa-confirm-token">{copy.codeLabel}</Label>
            <OtpInput
              id="mfa-confirm-token"
              value={token}
              onChange={(next) => form.setValue('token', next, { shouldValidate: true })}
              disabled={isConfirming}
            />
            {error && <p className="text-error text-xs font-medium">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isConfirming}>
              {copy.cancelButton}
            </Button>
            <Button type="submit" disabled={isConfirming}>
              {isConfirming ? copy.confirming : copy.confirmButton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
