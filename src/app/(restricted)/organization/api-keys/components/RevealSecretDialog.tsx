'use client';

import { useState } from 'react';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { t } from '@/locales';

const copy = t.organizations.apiKeys.reveal;

type Props = Readonly<{
  secret: string | null;
  onDismiss: () => void;
}>;

/**
 * The one-time secret reveal. `secret` lives only in this component's props —
 * passed down from the create dialog's mutation response, never written to a
 * query key, the TanStack cache, or the URL. See `services/apiKeys.ts`.
 *
 * There is deliberately no "show again" affordance anywhere in this feature:
 * once this dialog is dismissed, nothing in the running app still holds the
 * value, matching what the backend guarantees — no endpoint can return it a
 * second time because nothing but the hash is ever stored.
 */
export default function RevealSecretDialog({ secret, onDismiss }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toast.success(copy.copied);
    } catch {
      toast.error(copy.copyFailed);
    }
  };

  return (
    <Dialog open={Boolean(secret)} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent className="max-w-lg" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
        </DialogHeader>

        <div className="bg-warning border-warning-foreground/20 flex gap-3 rounded-md border p-3">
          <AlertTriangle className="text-warning-foreground size-5 shrink-0" aria-hidden />
          <p className="text-warning-foreground text-sm">{copy.warning}</p>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">{copy.secretLabel}</p>
          <div className="flex items-center gap-2">
            <code className="bg-muted flex-1 overflow-x-auto rounded-md p-2 text-sm break-all select-all">
              {secret}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={copy.copyLabel}
              onClick={() => void handleCopy()}
            >
              {copied ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onDismiss}>
            {copy.done}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
