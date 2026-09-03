import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useInvalidateCache() {
  const queryClient = useQueryClient();

  const invalidate = useCallback(
    (...queryKey: unknown[]) => queryClient.invalidateQueries({ queryKey }),
    [queryClient]
  );

  const invalidateAll = useCallback(() => queryClient.invalidateQueries(), [queryClient]);

  return { invalidate, invalidateAll };
}
