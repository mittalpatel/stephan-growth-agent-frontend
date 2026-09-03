'use client';

import { useRef, useState } from 'react';
import { AlertTriangle, Check, Copy, Download } from 'lucide-react';
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

const copy = t.userProfile.mfa;

// The "Copy all" checkmark is a transient confirmation, not a persistent
// state — without a reset it would still read "copied" if this same dialog
// instance is reopened later for a freshly regenerated set of codes.
const COPIED_RESET_DELAY_MS = 2000;

type Props = Readonly<{
  codes: string[] | null;
  onDismiss: () => void;
}>;

/**
 * The one-time recovery-codes reveal. `codes` lives only in `useMfa`'s
 * in-memory state, passed down from the confirm/regenerate mutation response
 * — never written to a query key, the TanStack cache, or the URL. Same
 * discipline as `RevealSecretDialog` for API keys: there is no "show again"
 * affordance, matching what the backend guarantees (each code is deleted
 * from storage the moment it is used, and regenerating invalidates the
 * whole prior set).
 */
export default function MfaRecoveryCodesDialog({ codes, onDismiss }: Props) {
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearResetTimeout() {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }

  // Closing the dialog drops the checkmark immediately, so reopening it later
  // for a newly regenerated set never starts on a stale "copied" state.
  function handleOpenChange(open: boolean) {
    if (open) return;
    clearResetTimeout();
    setCopied(false);
    onDismiss();
  }

  const handleCopyAll = async () => {
    if (!codes) return;
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopied(true);
      clearResetTimeout();
      resetTimeoutRef.current = setTimeout(() => setCopied(false), COPIED_RESET_DELAY_MS);
      toast.success(copy.copied);
    } catch {
      toast.error(copy.copyFailed);
    }
  };

  // A local text file, not `downloadBlob` (that helper fetches binary from an
  // authenticated endpoint — these codes already live in memory, minted by
  // the confirm/regenerate response, so there's nothing to fetch). Plain
  // `text/plain`, no network round trip.
  const handleDownload = () => {
    if (!codes) return;
    const blob = new Blob([codes.join('\n') + '\n'], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recovery-codes.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={Boolean(codes)} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{copy.recoveryCodesDialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="bg-warning border-warning-foreground/20 flex gap-3 rounded-md border p-3">
          <AlertTriangle className="text-warning-foreground size-5 shrink-0" aria-hidden />
          <p className="text-warning-foreground text-sm">{copy.recoveryCodesWarning}</p>
        </div>

        {codes && (
          <div className="bg-muted grid grid-cols-2 gap-2 rounded-md p-3 font-mono text-sm select-all">
            {codes.map((code) => (
              <span key={code}>{code}</span>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleDownload}>
            <Download className="size-4" aria-hidden />
            {copy.downloadButton}
          </Button>
          <Button type="button" variant="outline" onClick={() => void handleCopyAll()}>
            {copied ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            {copy.copyAllButton}
          </Button>
          <Button type="button" onClick={() => handleOpenChange(false)}>
            {copy.recoveryCodesDone}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
