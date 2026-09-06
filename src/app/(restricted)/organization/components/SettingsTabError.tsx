'use client';

import { AlertTriangle } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';

/**
 * The failed-to-load state shared by every settings tab.
 *
 * Each tab prefills a form from its own GET, so a failed read must not fall
 * through to an empty form: saving that would overwrite real settings with
 * blanks. Every tab renders this instead of its form when the read fails.
 */
export function SettingsTabError({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title={t.organizations.settingsTabs.errorTitle}
      description={t.organizations.settingsTabs.errorDescription}
      action={
        <Button variant="outline" onClick={onRetry}>
          {t.buttons.tryAgain}
        </Button>
      }
    />
  );
}
