'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Render the action button in the danger style (for deletes/deactivations). */
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Promise-based confirm dialog, mounted once at the app root.
 *
 *     const confirm = useConfirm();
 *     if (await confirm({ title, message, destructive: true })) {
 *       await deleteThing();
 *     }
 *
 * Replaces the per-component `confirmOpen`/`pendingDelete` state every destructive
 * action used to re-roll. One dialog instance services the whole tree.
 */
export function ConfirmProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  // Holds the pending promise's resolver between `confirm()` and the user's click.
  const resolverRef = useRef<((result: boolean) => void) | null>(null);

  const settle = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOpen(false);
  }, []);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  // If the dialog closes without a decision (Esc, backdrop), treat it as cancel.
  const onOpenChange = useCallback(
    (next: boolean) => {
      if (!next) settle(false);
    },
    [settle]
  );

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {options && (
        <ConfirmDialog
          open={open}
          title={options.title}
          message={options.message}
          confirmLabel={options.confirmLabel}
          cancelLabel={options.cancelLabel}
          destructive={options.destructive}
          onConfirm={() => settle(true)}
          onOpenChange={onOpenChange}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a <ConfirmProvider>');
  return ctx;
}
