'use client';

import { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useMfa } from '@/hooks/useMfa';
import { t } from '@/locales';

import MfaDisableDialog from './MfaDisableDialog';
import MfaEnrollDialog from './MfaEnrollDialog';
import MfaRecoveryCodesDialog from './MfaRecoveryCodesDialog';

const copy = t.userProfile.mfa;
const CARD = 'rounded-2xl border border-border bg-card p-6 shadow-sm';

function SectionHeader({ icon, title }: Readonly<{ icon: React.ReactNode; title: string }>) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-input pb-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        {icon}
      </span>
      <h2 className="text-lg font-normal text-foreground">{title}</h2>
    </div>
  );
}

export function MfaSection() {
  const {
    isLoading,
    enabled,
    startEnroll,
    isEnrolling,
    pendingSecret,
    confirmEnroll,
    isConfirming,
    cancelEnroll,
    disable,
    isDisabling,
    regenerateRecoveryCodes,
    isRegenerating,
    pendingRecoveryCodes,
    dismissRecoveryCodes,
  } = useMfa();
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);

  return (
    <section className={CARD}>
      <SectionHeader icon={<KeyRound className="h-4 w-4" />} title={copy.sectionTitle} />

      <p className="mb-4 text-sm text-muted-foreground">{copy.description}</p>

      {!isLoading && (
        <div className="mb-4 flex items-center gap-2">
          <span
            className={
              enabled
                ? 'inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold uppercase text-success'
                : 'inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase text-muted-foreground'
            }
          >
            {enabled && <ShieldCheck className="h-3.5 w-3.5" />}
            {enabled ? copy.statusEnabled : copy.statusDisabled}
          </span>
        </div>
      )}

      {!enabled && (
        <Button onClick={() => void startEnroll()} disabled={isEnrolling || isLoading}>
          {isEnrolling ? copy.enabling : copy.enableButton}
        </Button>
      )}

      {enabled && (
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => void regenerateRecoveryCodes()}
            disabled={isRegenerating}
          >
            {isRegenerating ? copy.regenerating : copy.regenerateCodesButton}
          </Button>

          <Button
            variant="destructive"
            disabled={isDisabling}
            onClick={() => setDisableDialogOpen(true)}
          >
            {isDisabling ? copy.disabling : copy.disableButton}
          </Button>
          <MfaDisableDialog
            open={disableDialogOpen}
            isDisabling={isDisabling}
            onConfirm={disable}
            onOpenChange={setDisableDialogOpen}
          />
        </div>
      )}

      <MfaEnrollDialog
        enrollment={pendingSecret}
        isConfirming={isConfirming}
        onConfirm={confirmEnroll}
        onCancel={cancelEnroll}
      />
      <MfaRecoveryCodesDialog codes={pendingRecoveryCodes} onDismiss={dismissRecoveryCodes} />
    </section>
  );
}
