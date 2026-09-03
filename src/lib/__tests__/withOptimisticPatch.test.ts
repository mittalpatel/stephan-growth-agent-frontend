import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import * as Sentry from '@sentry/nextjs';
import { withOptimisticPatch } from '../withOptimisticPatch';
import { t } from '@/locales';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('withOptimisticPatch', () => {
  it('on success: does not roll back, shows the success toast, reports nothing', async () => {
    const rollback = vi.fn();
    const patchFn = vi.fn(() => rollback);
    const apiFn = vi.fn().mockResolvedValue(undefined);

    await withOptimisticPatch(patchFn, apiFn, 'Saved');

    expect(patchFn).toHaveBeenCalledTimes(1);
    expect(apiFn).toHaveBeenCalledTimes(1);
    expect(rollback).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Saved');
    expect(toast.error).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('on success without a success message: shows no toast', async () => {
    const rollback = vi.fn();
    await withOptimisticPatch(() => rollback, vi.fn().mockResolvedValue(undefined));
    expect(toast.success).not.toHaveBeenCalled();
    expect(rollback).not.toHaveBeenCalled();
  });

  it('on failure: rolls back exactly once, reports to Sentry, shows the error toast', async () => {
    const rollback = vi.fn();
    const error = new Error('network down');
    const apiFn = vi.fn().mockRejectedValue(error);

    await withOptimisticPatch(() => rollback, apiFn, 'Saved');

    expect(rollback).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
    expect(toast.error).toHaveBeenCalledWith(t.common.somethingWentWrong);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('does not throw when the API call rejects (failure is swallowed after rollback)', async () => {
    await expect(
      withOptimisticPatch(() => vi.fn(), vi.fn().mockRejectedValue(new Error('boom')))
    ).resolves.toBeUndefined();
  });

  it('applies the optimistic patch before the API call', async () => {
    const order: string[] = [];
    const patchFn = vi.fn(() => {
      order.push('patch');
      return vi.fn();
    });
    const apiFn = vi.fn(async () => {
      order.push('api');
    });

    await withOptimisticPatch(patchFn, apiFn);

    expect(order).toEqual(['patch', 'api']);
  });
});
