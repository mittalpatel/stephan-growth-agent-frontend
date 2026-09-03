'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t } from '@/locales';

const copy = t.userProfile.mfa;

// A recovery code (8 chars) is also accepted — see MfaService.verify_code —
// so this can't be pinned to exactly 6 digits like the enroll-confirm form.
const disableSchema = z.object({
  token: z.string().trim().min(6).max(16),
});
type DisableFormValues = z.infer<typeof disableSchema>;

type Props = Readonly<{
  open: boolean;
  isDisabling: boolean;
  onConfirm: (token: string) => Promise<boolean>;
  onOpenChange: (open: boolean) => void;
}>;

/**
 * Confirms disabling MFA by requiring the current TOTP code (or a recovery
 * code) — proof of possession of the factor being removed, not just an
 * authenticated session. See MfaService.disable's docstring for why: an
 * authenticated-session-only disable would let a hijacked session
 * permanently downgrade the account's security, not just misuse it.
 *
 * A controlled `Dialog`, not the simpler `AlertDialog` the confirm button
 * used before this required a code: a wrong code must keep the dialog open
 * with an inline error, which `AlertDialogAction`'s default auto-close
 * behavior doesn't support without fighting it.
 */
export default function MfaDisableDialog({ open, isDisabling, onConfirm, onOpenChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<DisableFormValues>({
    resolver: zodResolver(disableSchema),
    defaultValues: { token: '' },
  });

  async function onSubmit(values: DisableFormValues) {
    setError(null);
    const ok = await onConfirm(values.token.trim());
    if (ok) {
      form.reset();
      onOpenChange(false);
    } else {
      setError(copy.invalidCode);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset();
      setError(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{copy.disableConfirmTitle}</DialogTitle>
          <DialogDescription>{copy.disableConfirmBody}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="mfa-disable-token">{copy.codeLabel}</Label>
            <Input
              id="mfa-disable-token"
              inputMode="text"
              autoComplete="one-time-code"
              placeholder={copy.codePlaceholder}
              disabled={isDisabling}
              autoFocus
              {...form.register('token')}
            />
            {error && <p className="text-error text-xs font-medium">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isDisabling}
            >
              {copy.cancelButton}
            </Button>
            <Button type="submit" variant="destructive" disabled={isDisabling}>
              {isDisabling ? copy.disabling : copy.disableConfirmButton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
