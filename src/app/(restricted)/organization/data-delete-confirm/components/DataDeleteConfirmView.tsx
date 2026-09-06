'use client';

import { useSearchParams } from 'next/navigation';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { SETTINGS_DATA_DELETE_CONFIRM_ENDPOINT } from '@/services/settings';
import { t } from '@/locales';

/** Landing page for the emailed "confirm organization deletion" link. */
export function DataDeleteConfirmView() {
  const token = useSearchParams().get('token') ?? '';
  const { mutateAsync, isPending, isSuccess } = useAuthMutation();

  const confirm = async () => {
    try {
      await mutateAsync({ url: SETTINGS_DATA_DELETE_CONFIRM_ENDPOINT, body: { token } });
    } catch (error) {
      applyApiError(error);
    }
  };

  return (
    <div className="max-w-md space-y-4">
      <PageHeader title={t.organizations.settingsTabs.data.deleteConfirmTitle} />
      {isSuccess ? (
        <p className="text-sm">{t.organizations.settingsTabs.data.deleteConfirmed}</p>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {t.organizations.settingsTabs.data.deleteConfirmBody}
          </p>
          <Button
            variant="destructive"
            disabled={!token || isPending}
            onClick={() => void confirm()}
          >
            {t.organizations.settingsTabs.data.deleteConfirmAction}
          </Button>
        </>
      )}
    </div>
  );
}
