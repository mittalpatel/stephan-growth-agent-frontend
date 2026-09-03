'use client';

import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { t } from '@/locales';

export type ConfirmDialogProps = Readonly<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}>;

/**
 * Generic confirm dialog used app-wide via the `useConfirm()` hook. Labels default
 * to the shared `t.buttons` copy so callers only pass `title`/`message` for a basic
 * confirm; `destructive` switches the action button to the danger style.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  loading,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div
          className={`flex gap-3 rounded-md border p-4 ${
            destructive ? 'bg-destructive/10 border-transparent' : 'bg-warning border-transparent'
          }`}
        >
          <AlertTriangle
            className={`h-5 w-5 shrink-0 ${destructive ? 'text-destructive' : 'text-warning-foreground'}`}
            aria-hidden
          />
          <p className={`text-sm ${destructive ? 'text-destructive' : 'text-warning-foreground'}`}>
            {message}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel ?? t.buttons.cancel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Spinner />}
            {confirmLabel ?? t.buttons.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
