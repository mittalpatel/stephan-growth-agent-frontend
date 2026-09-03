import { toast } from 'sonner';
import * as Sentry from '@sentry/nextjs';
import { t } from '@/locales';

/**
 * Runs an optimistic cache patch, fires the API call, and rolls back + toasts
 * on failure. Keeps each toggle handler to 3-4 lines instead of 10+.
 *
 * @param patchFn  - Call list.patchItem(...) here; must return the rollback fn.
 * @param apiFn    - Async API call (axiosAuth.patch / delete / etc.).
 * @param successMsg - Toast shown on success (omit to skip the success toast).
 * @param onSuccess - Ran after a successful call — pass `list.refetch` so the row
 *                    reflects the server's state (incl. side effects) rather than
 *                    the optimistic/cached value.
 */
export async function withOptimisticPatch(
  patchFn: () => () => void,
  apiFn: () => Promise<unknown>,
  successMsg?: string,
  onSuccess?: () => void
): Promise<void> {
  const rollback = patchFn();
  try {
    await apiFn();
    if (successMsg) toast.success(successMsg);
    onSuccess?.();
  } catch (error) {
    rollback();
    Sentry.captureException(error);
    toast.error(t.common.somethingWentWrong);
  }
}
