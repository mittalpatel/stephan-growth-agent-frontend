'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { DEFAULT_LANDING } from '@/constants/navItems';
import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { SETTINGS_DATA_DELETE_CONFIRM_ENDPOINT } from '@/services/settings';
import { t } from '@/locales';

/**
 * Landing page for the emailed "confirm organization deletion" link.
 *
 * Its own page rather than a dialog because the link is opened from an email,
 * outside this session's normal navigation. On success it navigates away and
 * refreshes: the session's active organization has just been deleted, so the
 * restricted layout must re-read the session from the server rather than keep
 * trusting the now-stale client copy — the same move
 * `useOrganizationSettingsForm.deleteOrganization` already makes.
 */
export function DataDeleteConfirmView() {
  const token = useSearchParams().get('token') ?? '';
  const router = useRouter();
  const { mutateAsync, isPending, isSuccess } = useAuthMutation();

  const confirm = async () => {
    try {
      await mutateAsync({ url: SETTINGS_DATA_DELETE_CONFIRM_ENDPOINT, body: { token } });
      router.push(DEFAULT_LANDING);
      router.refresh();
    } catch (error) {
      applyApiError(error);
    }
  };

  function renderBody() {
    if (isSuccess) {
      return <p className="text-sm">{t.organizations.settingsTabs.data.deleteConfirmed}</p>;
    }

    // A link opened without its token (truncated by a mail client, hand-typed)
    // would otherwise show a permanently disabled button and no reason why.
    if (!token) {
      return (
        <p className="text-muted-foreground text-sm">
          {t.organizations.settingsTabs.data.deleteConfirmMissingToken}
        </p>
      );
    }

    return (
      <>
        <p className="text-muted-foreground text-sm">
          {t.organizations.settingsTabs.data.deleteConfirmBody}
        </p>
        <Button variant="destructive" disabled={isPending} onClick={() => void confirm()}>
          {t.organizations.settingsTabs.data.deleteConfirmAction}
        </Button>
      </>
    );
  }

  return (
    <div className="max-w-md space-y-4">
      <PageHeader title={t.organizations.settingsTabs.data.deleteConfirmTitle} />
      {renderBody()}
    </div>
  );
}
